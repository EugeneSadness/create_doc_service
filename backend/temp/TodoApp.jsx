
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import styled from 'styled-components';

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

/**
 * API service for todo operations
 */
const TodoService = {
  /**
   * Fetches all todos from the API
   * @returns {Promise<Array>} Promise resolving to an array of todos
   */
  async fetchTodos() {
    const response = await axios.get('/api/todos');
    return response.data;
  },
  
  /**
   * Creates a new todo
   * @param {Object} todo - The todo to create
   * @returns {Promise<Object>} Promise resolving to the created todo
   */
  async createTodo(todo) {
    const response = await axios.post('/api/todos', todo);
    return response.data;
  },
  
  /**
   * Updates an existing todo
   * @param {number} id - The ID of the todo to update
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Object>} Promise resolving to the updated todo
   */
  async updateTodo(id, updates) {
    const response = await axios.put(`/api/todos/${id}`, updates);
    return response.data;
  },
  
  /**
   * Deletes a todo
   * @param {number} id - The ID of the todo to delete
   * @returns {Promise<void>}
   */
  async deleteTodo(id) {
    await axios.delete(`/api/todos/${id}`);
  }
};

export default TodoApp;
