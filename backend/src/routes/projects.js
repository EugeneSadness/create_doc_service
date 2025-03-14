const express = require('express');
const { query } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { analyzeRepository } = require('../services/repositoryAnalyzer');
const { analyzeJavaScriptFile } = require('../services/jsAnalyzer');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
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
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
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
    const { repository_url, name } = req.body;
    
    const result = await query(
      'INSERT INTO projects (user_id, repository_url, name) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, repository_url, name]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/generate', async (req, res, next) => {
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
    
    const documentationContent = await analyzeRepository(project.repository_url);
    
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

// Тестовый маршрут для анализа локального файла
router.post('/test-analyzer', async (req, res, next) => {
  try {
    // Создаем временную директорию с тестовым файлом
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Создаем тестовый файл с React компонентом
    const testFilePath = path.join(tempDir, 'TestComponent.jsx');
    const testFileContent = `
import React, { useState, useEffect } from 'react';

/**
 * TodoList component displays a list of todo items
 * and provides functionality to add, toggle, and delete todos.
 */
const TodoList = ({ initialTodos = [] }) => {
  const [todos, setTodos] = useState(initialTodos);
  const [newTodo, setNewTodo] = useState('');
  
  /**
   * Adds a new todo item to the list
   * @param {string} text - The text of the todo item
   */
  const addTodo = (text) => {
    if (text.trim() === '') return;
    const newTodoItem = {
      id: Date.now(),
      text,
      completed: false
    };
    setTodos([...todos, newTodoItem]);
    setNewTodo('');
  };
  
  /**
   * Toggles the completed status of a todo item
   * @param {number} id - The ID of the todo item to toggle
   */
  const toggleTodo = (id) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };
  
  /**
   * Removes a todo item from the list
   * @param {number} id - The ID of the todo item to remove
   */
  const removeTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  /**
   * TodoItem component displays a single todo item
   */
  const TodoItem = ({ todo, onToggle, onRemove }) => (
    <li className={todo.completed ? 'completed' : ''}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.text}</span>
      <button onClick={() => onRemove(todo.id)}>Delete</button>
    </li>
  );
  
  return (
    <div className="todo-list">
      <h1>Todo List</h1>
      
      <div className="add-todo">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
        />
        <button onClick={() => addTodo(newTodo)}>Add</button>
      </div>
      
      <ul>
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onRemove={removeTodo}
          />
        ))}
      </ul>
      
      <div className="todo-count">
        {todos.length} items ({todos.filter(t => t.completed).length} completed)
      </div>
    </div>
  );
};

/**
 * TodoApp is the main application component
 */
class TodoApp extends React.Component {
  /**
   * Constructor initializes the component
   * @param {object} props - Component props
   */
  constructor(props) {
    super(props);
    this.state = {
      todos: []
    };
  }
  
  /**
   * Lifecycle method that runs after component mounts
   */
  componentDidMount() {
    // Load todos from localStorage
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      this.setState({ todos: JSON.parse(savedTodos) });
    }
  }
  
  /**
   * Renders the component
   * @returns {JSX.Element} The rendered component
   */
  render() {
    return (
      <div className="todo-app">
        <TodoList initialTodos={this.state.todos} />
      </div>
    );
  }
}

export default TodoApp;
`;
    
    await fs.writeFile(testFilePath, testFileContent);
    
    // Анализируем тестовый файл
    const analysis = await analyzeJavaScriptFile(testFilePath);
    
    // Очищаем временную директорию
    await fs.unlink(testFilePath);
    
    res.json({
      analysis,
      message: 'Test file analyzed successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 