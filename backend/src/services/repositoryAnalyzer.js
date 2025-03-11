const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const simpleGit = require('simple-git');

async function analyzeRepository(repoUrl) {
  try {
    const tempDir = path.join(os.tmpdir(), `repo-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const git = simpleGit();
    await git.clone(repoUrl, tempDir);

    const structure = await analyzeProjectStructure(tempDir);

    const projectInfo = await analyzeProjectInfo(tempDir);

    const readme = await analyzeReadme(tempDir);

    const codeAnalysis = await analyzeCode(tempDir);

    const documentation = {
      projectInfo,
      structure,
      readme,
      api: codeAnalysis.api,
      components: codeAnalysis.components
    };

    await fs.rm(tempDir, { recursive: true, force: true });
    
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
    components: []
  };
  

  try {
    const jsFiles = await findFiles(projectPath, ['.js', '.jsx', '.ts', '.tsx']);
    
    for (const file of jsFiles) {
      const content = await fs.readFile(file, 'utf8');
      
      const functionMatches = content.match(/\/\*\*[\s\S]*?\*\/\s*(?:function|const|let|var)\s+(\w+)/g) || [];
      
      for (const match of functionMatches) {
        const nameMatch = match.match(/(?:function|const|let|var)\s+(\w+)/);
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1];
          const description = match.match(/\/\*\*([\s\S]*?)\*\//)[1]
            .replace(/\*/g, '')
            .trim();
          
          result.api.push({
            name,
            description,
            file: path.relative(projectPath, file)
          });
        }
      }
      
      if (file.endsWith('.jsx') || file.endsWith('.tsx') || content.includes('React')) {
        const componentMatches = content.match(/(?:function|const)\s+(\w+)\s*(?:=\s*\([^)]*\)\s*=>|=\s*React\.memo|=\s*React\.forwardRef|=\s*\(|\([^)]*\)\s*{)/g) || [];
        
        for (const match of componentMatches) {
          const nameMatch = match.match(/(?:function|const)\s+(\w+)/);
          if (nameMatch && nameMatch[1] && /^[A-Z]/.test(nameMatch[1])) {
            result.components.push({
              name: nameMatch[1],
              file: path.relative(projectPath, file)
            });
          }
        }
      }
    }
    
    const pyFiles = await findFiles(projectPath, ['.py']);
    
    for (const file of pyFiles) {
      const content = await fs.readFile(file, 'utf8');
      
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
            file: path.relative(projectPath, file)
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

module.exports = {
  analyzeRepository
}; 