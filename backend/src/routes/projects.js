const express = require('express');
const { query } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { analyzeRepository, generateProjectOverview } = require('../services/repositoryAnalyzer');
const { analyzeJavaScriptFile } = require('../services/jsAnalyzer');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT p.*, (SELECT COUNT(*) > 0 FROM documentation d WHERE d.project_id = p.id) AS has_documentation FROM projects p WHERE p.user_id = $1 ORDER BY p.created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT p.*, (SELECT COUNT(*) > 0 FROM documentation d WHERE d.project_id = p.id) AS has_documentation FROM projects p WHERE p.id = $1 AND p.user_id = $2',
      [req.params.id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    console.log('Получен запрос на создание проекта:', req.body);
    const { name, repository_url, repositoryUrl, description } = req.body;
    const repoUrl = repository_url || repositoryUrl;
    
    console.log('Используем URL репозитория:', repoUrl);
    
    if (!name || !repoUrl) {
      return res.status(400).json({ error: 'Name and repository URL are required' });
    }
    
    const result = await query(
      'INSERT INTO projects (user_id, repository_url, name, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, repoUrl, name, description || null]
    );
    
    console.log('Проект успешно создан:', result.rows[0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании проекта:', error);
    next(error);
  }
});

router.post('/:id/generate-docs', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.userId]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    
    console.log(`Начинаю анализ репозитория: ${project.repository_url}`);
    const documentationContent = await analyzeRepository(project.repository_url);
    console.log(`Анализ репозитория завершен`);
    
    // Save documentation to database
    const docResult = await query(
      'INSERT INTO documentation (project_id, content, version) VALUES ($1, $2, $3) RETURNING *',
      [projectId, documentationContent, '1.0']
    );
    
    await query(
      'UPDATE projects SET last_analyzed_at = NOW() WHERE id = $1',
      [projectId]
    );
    
    res.status(201).json(docResult.rows[0]);
  } catch (error) {
    console.error('Error generating documentation:', error);
    next(error);
  }
});

router.get('/:id/documentation', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.userId]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const docResult = await query(
      'SELECT * FROM documentation WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
      [projectId]
    );
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Documentation not found' });
    }
    
    res.json(docResult.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Получение истории документаций проекта
router.get('/:id/documentation/history', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.userId]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const docResult = await query(
      'SELECT id, version, created_at FROM documentation WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    
    res.json(docResult.rows);
  } catch (error) {
    next(error);
  }
});

// Получение конкретной версии документации
router.get('/:id/documentation/:docId', async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const docResult = await query(
      'SELECT * FROM documentation WHERE id = $1 AND project_id = $2',
      [docId, id]
    );
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Documentation not found' });
    }
    
    res.json(docResult.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Удаление проекта
router.delete('/:id', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    
    // Проверяем, существует ли проект и принадлежит ли он пользователю
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.userId]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Сначала удаляем все документации проекта
    await query('DELETE FROM documentation WHERE project_id = $1', [projectId]);
    
    // Затем удаляем сам проект
    await query('DELETE FROM projects WHERE id = $1', [projectId]);
    
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Упрощенный тестовый маршрут
router.post('/test-analyzer', async (req, res, next) => {
  try {
    // Создаем временную директорию для тестовых файлов
    const tempDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Создаем package.json с зависимостями
    const packageJson = {
      name: "todo-app",
      version: "1.0.0",
      description: "A simple React Todo application",
      dependencies: {
        "react": "^17.0.2",
        "react-dom": "^17.0.2",
        "react-router-dom": "^6.0.0",
        "axios": "^0.24.0"
      },
      devDependencies: {
        "jest": "^27.0.0",
        "webpack": "^5.0.0"
      }
    };
    
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Создаем тестовый файл TodoApp.jsx
    const testFilePath = path.join(tempDir, 'TodoApp.jsx');
    const testFileContent = `
import React, { useState, useEffect } from 'react';

/**
 * TodoService - API для работы с задачами
 */
const TodoService = {
  /**
   * Получает список задач с сервера
   * @returns {Promise<Array>} Массив задач
   */
  fetchTodos: async () => {
    const response = await fetch('/api/todos');
    return response.json();
  },
  
  /**
   * Добавляет новую задачу
   * @param {string} title - Название задачи
   * @returns {Promise<Object>} Созданная задача
   */
  addTodo: async (title) => {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, completed: false })
    });
    return response.json();
  },
  
  /**
   * Переключает статус выполнения задачи
   * @param {number} id - ID задачи
   * @param {boolean} completed - Новый статус
   * @returns {Promise<Object>} Обновленная задача
   */
  toggleTodo: async (id, completed) => {
    const response = await fetch(\`/api/todos/\${id}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    return response.json();
  },
  
  /**
   * Удаляет задачу
   * @param {number} id - ID задачи
   * @returns {Promise<void>}
   */
  deleteTodo: async (id) => {
    await fetch(\`/api/todos/\${id}\`, {
      method: 'DELETE'
    });
  }
};

/**
 * Компонент для отображения отдельной задачи
 * @param {Object} props - Свойства компонента
 * @param {Object} props.todo - Объект задачи
 * @param {Function} props.onToggle - Функция для переключения статуса
 * @param {Function} props.onDelete - Функция для удаления задачи
 */
const TodoItem = ({ todo, onToggle, onDelete }) => {
  return (
    <div className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id, !todo.completed)}
      />
      <span className={todo.completed ? 'completed' : ''}>
        {todo.title}
      </span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
};

/**
 * Компонент для отображения списка задач
 * @param {Object} props - Свойства компонента
 * @param {Array} props.todos - Массив задач
 * @param {Function} props.onToggle - Функция для переключения статуса
 * @param {Function} props.onDelete - Функция для удаления задачи
 */
const TodoList = ({ todos, onToggle, onDelete }) => {
  if (todos.length === 0) {
    return <p>No todos yet. Add some!</p>;
  }
  
  return (
    <div className="todo-list">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

/**
 * Основной компонент приложения для управления задачами
 */
class TodoApp extends React.Component {
  /**
   * Конструктор компонента
   * @param {Object} props - Свойства компонента
   */
  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      newTodoTitle: '',
      loading: true,
      error: null
    };
  }
  
  /**
   * Загружает задачи при монтировании компонента
   */
  componentDidMount() {
    this.fetchTodos();
  }
  
  /**
   * Загружает список задач с сервера
   */
  fetchTodos = async () => {
    try {
      this.setState({ loading: true });
      const todos = await TodoService.fetchTodos();
      this.setState({ todos, loading: false, error: null });
    } catch (error) {
      this.setState({ error: 'Failed to load todos', loading: false });
    }
  };
  
  /**
   * Обрабатывает изменение поля ввода
   * @param {Event} e - Событие изменения
   */
  handleInputChange = (e) => {
    this.setState({ newTodoTitle: e.target.value });
  };
  
  /**
   * Добавляет новую задачу
   * @param {Event} e - Событие отправки формы
   */
  handleAddTodo = async (e) => {
    e.preventDefault();
    const { newTodoTitle } = this.state;
    
    if (!newTodoTitle.trim()) return;
    
    try {
      const newTodo = await TodoService.addTodo(newTodoTitle);
      this.setState(prevState => ({
        todos: [...prevState.todos, newTodo],
        newTodoTitle: '',
        error: null
      }));
    } catch (error) {
      this.setState({ error: 'Failed to add todo' });
    }
  };
  
  /**
   * Переключает статус выполнения задачи
   * @param {number} id - ID задачи
   * @param {boolean} completed - Новый статус
   */
  handleToggleTodo = async (id, completed) => {
    try {
      await TodoService.toggleTodo(id, completed);
      this.setState(prevState => ({
        todos: prevState.todos.map(todo =>
          todo.id === id ? { ...todo, completed } : todo
        ),
        error: null
      }));
    } catch (error) {
      this.setState({ error: 'Failed to update todo' });
    }
  };
  
  /**
   * Удаляет задачу
   * @param {number} id - ID задачи
   */
  handleDeleteTodo = async (id) => {
    try {
      await TodoService.deleteTodo(id);
      this.setState(prevState => ({
        todos: prevState.todos.filter(todo => todo.id !== id),
        error: null
      }));
    } catch (error) {
      this.setState({ error: 'Failed to delete todo' });
    }
  };
  
  /**
   * Рендерит компонент
   * @returns {JSX.Element} Элемент React
   */
  render() {
    const { todos, newTodoTitle, loading, error } = this.state;
    
    return (
      <div className="todo-app">
        <h1>Todo App</h1>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={this.handleAddTodo}>
          <input
            type="text"
            value={newTodoTitle}
            onChange={this.handleInputChange}
            placeholder="Add a new todo..."
          />
          <button type="submit">Add</button>
        </form>
        
        {loading ? (
          <p>Loading todos...</p>
        ) : (
          <TodoList
            todos={todos}
            onToggle={this.handleToggleTodo}
            onDelete={this.handleDeleteTodo}
          />
        )}
      </div>
    );
  }
}

export default TodoApp;
    `;
    
    await fs.writeFile(testFilePath, testFileContent);
    
    // Создаем index.js
    await fs.writeFile(
      path.join(tempDir, 'index.js'),
      `
import React from 'react';
import ReactDOM from 'react-dom';
import TodoApp from './TodoApp';
import './styles.css';

ReactDOM.render(
  <React.StrictMode>
    <TodoApp />
  </React.StrictMode>,
  document.getElementById('root')
);
      `
    );
    
    // Создаем styles.css
    await fs.writeFile(
      path.join(tempDir, 'styles.css'),
      `
.todo-app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.completed {
  text-decoration: line-through;
  color: #888;
}

form {
  display: flex;
  margin-bottom: 20px;
}

input[type="text"] {
  flex: 1;
  padding: 8px;
  font-size: 16px;
}

button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
}

.error {
  color: red;
  margin-bottom: 10px;
}
      `
    );
    
    // Анализируем тестовый файл
    const analysisResult = await analyzeJavaScriptFile(testFilePath);
    
    // Создаем структуру проекта
    const structure = {
      directories: ['src', 'public'],
      files: [
        'package.json',
        'src/index.js',
        'src/TodoApp.jsx',
        'src/styles.css',
        'public/index.html'
      ]
    };
    
    // Создаем информацию о проекте
    const projectInfo = {
      name: packageJson.name,
      description: packageJson.description,
      type: 'javascript',
      dependencies: Object.entries(packageJson.dependencies).map(([name, version]) => ({ name, version })),
      devDependencies: Object.entries(packageJson.devDependencies).map(([name, version]) => ({ name, version }))
    };
    
    // Генерируем обзор проекта
    const overview = await generateProjectOverview(tempDir, projectInfo, structure, {
      api: analysisResult.functions.filter(f => f.name.startsWith('fetch') || f.name.startsWith('add') || f.name.startsWith('toggle') || f.name.startsWith('delete')),
      components: analysisResult.components,
      classes: analysisResult.classes
    });
    
    // Очищаем временную директорию
    await fs.rm(tempDir, { recursive: true, force: true });
    
    res.json({
      analysisResult,
      overview,
      projectInfo,
      structure,
      message: 'Test file analyzed successfully'
    });
  } catch (error) {
    console.error('Error in test-analyzer route:', error);
    next(error);
  }
});

module.exports = router; 