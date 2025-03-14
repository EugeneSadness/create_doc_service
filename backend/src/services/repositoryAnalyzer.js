const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const simpleGit = require('simple-git');
const { analyzeJavaScriptFile } = require('./jsAnalyzer');

async function analyzeRepository(repoUrl) {
  try {
    console.log(`Начинаю анализ репозитория: ${repoUrl}`);
    const tempDir = path.join(os.tmpdir(), `repo-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    console.log(`Создана временная директория: ${tempDir}`);

    // Преобразуем URL в публичный URL для клонирования
    const publicRepoUrl = repoUrl.replace('https://github.com/', 'https://github.com/').replace(/\.git$/, '') + '.git';
    console.log(`Клонирую репозиторий из: ${publicRepoUrl}`);
    
    const git = simpleGit();
    await git.clone(publicRepoUrl, tempDir, ['--depth', '1']);
    console.log(`Репозиторий успешно клонирован`);

    console.log(`Анализирую структуру проекта...`);
    const structure = await analyzeProjectStructure(tempDir);
    console.log(`Структура проекта проанализирована`);

    console.log(`Анализирую информацию о проекте...`);
    const projectInfo = await analyzeProjectInfo(tempDir);
    console.log(`Информация о проекте проанализирована`);

    console.log(`Анализирую README...`);
    const readme = await analyzeReadme(tempDir);
    console.log(`README проанализирован`);

    console.log(`Анализирую код...`);
    const codeAnalysis = await analyzeCode(tempDir);
    console.log(`Код проанализирован`);

    console.log(`Генерирую общее описание проекта...`);
    const projectOverview = await generateProjectOverview(tempDir, projectInfo, structure, codeAnalysis);
    console.log(`Общее описание проекта сгенерировано`);

    const documentation = {
      projectInfo,
      structure,
      readme,
      overview: projectOverview,
      api: codeAnalysis.api,
      components: codeAnalysis.components,
      classes: codeAnalysis.classes
    };

    console.log(`Очищаю временную директорию...`);
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`Временная директория очищена`);
    
    console.log(`Анализ репозитория завершен успешно`);
    return documentation;
  } catch (error) {
    console.error('Error analyzing repository:', error);
    throw new Error(`Failed to analyze repository: ${error.message}`);
  }
}

async function analyzeProjectStructure(projectPath) {
  const structure = { directories: [], files: [] };
  
  async function scanDirectory(dir, relativePath = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);
      
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        structure.directories.push(entryRelativePath);
        await scanDirectory(fullPath, entryRelativePath);
      } else {
        structure.files.push(entryRelativePath);
      }
    }
  }
  
  await scanDirectory(projectPath);
  return structure;
}

async function analyzeProjectInfo(projectPath) {
  const projectInfo = {
    name: 'Unknown Project',
    description: '',
    dependencies: [],
    devDependencies: [],
    type: 'unknown'
  };
  
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJsonExists = await fileExists(packageJsonPath);
    
    if (packageJsonExists) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      projectInfo.name = packageJson.name || projectInfo.name;
      projectInfo.description = packageJson.description || '';
      projectInfo.type = 'javascript';
      
      if (packageJson.dependencies) {
        projectInfo.dependencies = Object.keys(packageJson.dependencies).map(dep => ({
          name: dep,
          version: packageJson.dependencies[dep]
        }));
      }
      
      if (packageJson.devDependencies) {
        projectInfo.devDependencies = Object.keys(packageJson.devDependencies).map(dep => ({
          name: dep,
          version: packageJson.devDependencies[dep]
        }));
      }
      
      return projectInfo;
    }
    
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const requirementsExists = await fileExists(requirementsPath);
    
    if (requirementsExists) {
      const requirements = await fs.readFile(requirementsPath, 'utf8');
      projectInfo.type = 'python';
      
      projectInfo.dependencies = requirements
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => {
          const [name, version] = line.split('==');
          return { name: name.trim(), version: version ? version.trim() : 'latest' };
        });
      
      return projectInfo;
    }
    
    return projectInfo;
  } catch (error) {
    console.error('Error analyzing project info:', error);
    return projectInfo;
  }
}

async function analyzeReadme(projectPath) {
  try {
    const readmePath = path.join(projectPath, 'README.md');
    const readmeExists = await fileExists(readmePath);
    
    if (readmeExists) {
      return await fs.readFile(readmePath, 'utf8');
    }
    
    return 'No README.md found in the repository.';
  } catch (error) {
    console.error('Error analyzing README:', error);
    return 'Failed to analyze README.md';
  }
}

async function analyzeCode(projectPath) {
  const result = {
    api: [],
    components: [],
    classes: []
  };
  
  try {
    // Анализ JavaScript/TypeScript файлов с использованием AST
    const jsFiles = await findFiles(projectPath, ['.js', '.jsx', '.ts', '.tsx']);
    console.log(`Найдено ${jsFiles.length} JavaScript/TypeScript файлов`);
    
    for (const file of jsFiles) {
      console.log(`Анализирую файл: ${file}`);
      const relativePath = path.relative(projectPath, file);
      
      try {
        const analysis = await analyzeJavaScriptFile(file);
        
        // Добавляем функции в API
        analysis.functions.forEach(func => {
          result.api.push({
            name: func.name,
            description: func.description,
            params: func.params,
            file: relativePath,
            line: func.line
          });
        });
        
        // Добавляем компоненты
        analysis.components.forEach(component => {
          result.components.push({
            name: component.name,
            description: component.description,
            props: component.props,
            file: relativePath,
            line: component.line
          });
        });
        
        // Добавляем классы
        analysis.classes.forEach(cls => {
          result.classes.push({
            name: cls.name,
            description: cls.description,
            methods: cls.methods,
            file: relativePath,
            line: cls.line
          });
        });
      } catch (error) {
        console.error(`Ошибка при анализе файла ${file}:`, error);
      }
    }
    
    // Анализ Python файлов (оставляем существующую логику)
    const pyFiles = await findFiles(projectPath, ['.py']);
    console.log(`Найдено ${pyFiles.length} Python файлов`);
    
    for (const file of pyFiles) {
      const content = await fs.readFile(file, 'utf8');
      const relativePath = path.relative(projectPath, file);
      
      const functionMatches = content.match(/def\s+(\w+)\s*\([^)]*\)\s*:(?:\s*"""[\s\S]*?""")?/g) || [];
      
      for (const match of functionMatches) {
        const nameMatch = match.match(/def\s+(\w+)/);
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1];
          const docstringMatch = match.match(/"""([\s\S]*?)"""/);
          const description = docstringMatch ? docstringMatch[1].trim() : 'No description';
          
          result.api.push({
            name,
            description,
            file: relativePath
          });
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error analyzing code:', error);
    return result;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findFiles(dir, extensions) {
  const result = [];
  
  async function scan(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        result.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return result;
}

async function generateProjectOverview(projectPath, projectInfo, structure, codeAnalysis) {
  try {
    const overview = {
      title: projectInfo.name || 'Unnamed Project',
      description: projectInfo.description || '',
      projectType: 'Unknown',
      mainFeatures: [],
      technologies: [],
      architecture: '',
      entryPoints: []
    };

    // Определяем тип проекта
    if (projectInfo.type === 'javascript') {
      // Проверяем наличие файлов, характерных для разных типов JS-проектов
      const hasReactFiles = structure.files.some(file => 
        file.endsWith('.jsx') || file.endsWith('.tsx') || 
        file.includes('react') || file.includes('React')
      );
      
      const hasNodeFiles = structure.files.some(file => 
        file.includes('server.js') || file.includes('app.js') || 
        file.includes('index.js') || file.includes('express') || 
        file.includes('koa') || file.includes('fastify')
      );
      
      const hasVueFiles = structure.files.some(file => 
        file.endsWith('.vue') || file.includes('vue')
      );
      
      const hasAngularFiles = structure.files.some(file => 
        file.includes('angular') || file.includes('ng-')
      );

      if (hasReactFiles && hasNodeFiles) {
        overview.projectType = 'Full-stack JavaScript Application (React + Node.js)';
        overview.architecture = 'Client-server architecture with React frontend and Node.js backend';
      } else if (hasReactFiles) {
        overview.projectType = 'React Frontend Application';
        overview.architecture = 'Component-based frontend application using React';
      } else if (hasVueFiles) {
        overview.projectType = 'Vue.js Frontend Application';
        overview.architecture = 'Component-based frontend application using Vue.js';
      } else if (hasAngularFiles) {
        overview.projectType = 'Angular Frontend Application';
        overview.architecture = 'Component-based frontend application using Angular';
      } else if (hasNodeFiles) {
        overview.projectType = 'Node.js Backend Application';
        overview.architecture = 'Server-side application using Node.js';
      } else {
        overview.projectType = 'JavaScript Application';
      }

      // Определяем основные технологии
      if (projectInfo.dependencies) {
        const dependencies = projectInfo.dependencies.map(dep => dep.name);
        
        if (dependencies.includes('react')) overview.technologies.push('React');
        if (dependencies.includes('react-dom')) overview.technologies.push('React DOM');
        if (dependencies.includes('react-router') || dependencies.includes('react-router-dom')) 
          overview.technologies.push('React Router');
        if (dependencies.includes('redux')) overview.technologies.push('Redux');
        if (dependencies.includes('vue')) overview.technologies.push('Vue.js');
        if (dependencies.includes('angular')) overview.technologies.push('Angular');
        if (dependencies.includes('express')) overview.technologies.push('Express.js');
        if (dependencies.includes('koa')) overview.technologies.push('Koa.js');
        if (dependencies.includes('fastify')) overview.technologies.push('Fastify');
        if (dependencies.includes('mongoose') || dependencies.includes('mongodb')) 
          overview.technologies.push('MongoDB');
        if (dependencies.includes('sequelize') || dependencies.includes('pg')) 
          overview.technologies.push('PostgreSQL');
        if (dependencies.includes('mysql')) overview.technologies.push('MySQL');
        if (dependencies.includes('axios') || dependencies.includes('fetch')) 
          overview.technologies.push('HTTP Client');
        if (dependencies.includes('webpack')) overview.technologies.push('Webpack');
        if (dependencies.includes('babel')) overview.technologies.push('Babel');
        if (dependencies.includes('typescript')) overview.technologies.push('TypeScript');
        if (dependencies.includes('jest') || dependencies.includes('mocha') || dependencies.includes('chai')) 
          overview.technologies.push('Testing Framework');
      }
    } else if (projectInfo.type === 'python') {
      // Проверяем наличие файлов, характерных для разных типов Python-проектов
      const hasDjangoFiles = structure.files.some(file => 
        file.includes('django') || file.includes('settings.py') || 
        file.includes('urls.py') || file.includes('wsgi.py')
      );
      
      const hasFlaskFiles = structure.files.some(file => 
        file.includes('flask') || file.includes('app.py') || 
        file.includes('routes.py')
      );
      
      const hasFastAPIFiles = structure.files.some(file => 
        file.includes('fastapi') || file.includes('main.py')
      );

      if (hasDjangoFiles) {
        overview.projectType = 'Django Web Application';
        overview.architecture = 'MVT (Model-View-Template) web application using Django';
      } else if (hasFlaskFiles) {
        overview.projectType = 'Flask Web Application';
        overview.architecture = 'Microframework-based web application using Flask';
      } else if (hasFastAPIFiles) {
        overview.projectType = 'FastAPI Web Application';
        overview.architecture = 'Modern API-focused web application using FastAPI';
      } else {
        overview.projectType = 'Python Application';
      }

      // Определяем основные технологии из requirements.txt
      if (projectInfo.dependencies) {
        const dependencies = projectInfo.dependencies.map(dep => dep.name);
        
        if (dependencies.includes('django')) overview.technologies.push('Django');
        if (dependencies.includes('flask')) overview.technologies.push('Flask');
        if (dependencies.includes('fastapi')) overview.technologies.push('FastAPI');
        if (dependencies.includes('sqlalchemy')) overview.technologies.push('SQLAlchemy');
        if (dependencies.includes('psycopg2') || dependencies.includes('psycopg2-binary')) 
          overview.technologies.push('PostgreSQL');
        if (dependencies.includes('pymysql') || dependencies.includes('mysqlclient')) 
          overview.technologies.push('MySQL');
        if (dependencies.includes('pymongo')) overview.technologies.push('MongoDB');
        if (dependencies.includes('requests')) overview.technologies.push('HTTP Client');
        if (dependencies.includes('pytest') || dependencies.includes('unittest')) 
          overview.technologies.push('Testing Framework');
        if (dependencies.includes('pandas')) overview.technologies.push('Data Analysis');
        if (dependencies.includes('numpy')) overview.technologies.push('Numerical Computing');
        if (dependencies.includes('tensorflow') || dependencies.includes('pytorch')) 
          overview.technologies.push('Machine Learning');
      }
    }

    // Определяем точки входа в приложение
    const entryFiles = ['index.js', 'app.js', 'server.js', 'main.py', 'app.py', 'manage.py'];
    for (const file of structure.files) {
      const fileName = path.basename(file);
      if (entryFiles.includes(fileName)) {
        overview.entryPoints.push(file);
      }
    }

    // Определяем основные функции на основе компонентов и классов
    if (codeAnalysis.components && codeAnalysis.components.length > 0) {
      overview.mainFeatures.push('Component-based UI');
      
      // Анализируем названия компонентов для определения функциональности
      const componentNames = codeAnalysis.components.map(comp => comp.name.toLowerCase());
      
      if (componentNames.some(name => name.includes('auth') || name.includes('login') || name.includes('register')))
        overview.mainFeatures.push('Authentication');
      
      if (componentNames.some(name => name.includes('form')))
        overview.mainFeatures.push('Form Handling');
      
      if (componentNames.some(name => name.includes('list') || name.includes('table') || name.includes('grid')))
        overview.mainFeatures.push('Data Display');
      
      if (componentNames.some(name => name.includes('nav') || name.includes('menu') || name.includes('sidebar')))
        overview.mainFeatures.push('Navigation');
      
      if (componentNames.some(name => name.includes('modal') || name.includes('dialog')))
        overview.mainFeatures.push('Modal Dialogs');
      
      if (componentNames.some(name => name.includes('chart') || name.includes('graph')))
        overview.mainFeatures.push('Data Visualization');
    }

    if (codeAnalysis.api && codeAnalysis.api.length > 0) {
      // Анализируем названия API функций для определения функциональности
      const apiNames = codeAnalysis.api.map(api => api.name.toLowerCase());
      
      if (apiNames.some(name => name.includes('get') || name.includes('fetch') || name.includes('load')))
        overview.mainFeatures.push('Data Fetching');
      
      if (apiNames.some(name => name.includes('post') || name.includes('create') || name.includes('add')))
        overview.mainFeatures.push('Data Creation');
      
      if (apiNames.some(name => name.includes('update') || name.includes('edit') || name.includes('modify')))
        overview.mainFeatures.push('Data Updating');
      
      if (apiNames.some(name => name.includes('delete') || name.includes('remove')))
        overview.mainFeatures.push('Data Deletion');
      
      if (apiNames.some(name => name.includes('auth') || name.includes('login') || name.includes('register')))
        overview.mainFeatures.push('Authentication');
    }

    // Удаляем дубликаты в массивах
    overview.technologies = [...new Set(overview.technologies)];
    overview.mainFeatures = [...new Set(overview.mainFeatures)];
    overview.entryPoints = [...new Set(overview.entryPoints)];

    return overview;
  } catch (error) {
    console.error('Error generating project overview:', error);
    return {
      title: projectInfo.name || 'Unnamed Project',
      description: projectInfo.description || '',
      projectType: 'Unknown',
      mainFeatures: [],
      technologies: [],
      architecture: '',
      entryPoints: []
    };
  }
}

module.exports = {
  analyzeRepository
}; 