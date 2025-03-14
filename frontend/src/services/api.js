import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const projectsApi = {
  getProjects: async () => {
    try {
      console.log('API: Отправляем запрос на получение списка проектов...');
      console.log('API: Токен авторизации:', localStorage.getItem('token'));
      console.log('API: Заголовки запроса:', api.defaults.headers);
      const response = await api.get('/projects');
      console.log('API: Получен ответ:', response);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching projects:', error);
      throw error;
    }
  },
  
  getProject: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw error;
    }
  },
  
  createProject: async (projectData) => {
    try {
      console.log('Отправляем запрос на создание проекта:', projectData);
      const response = await api.post('/projects', projectData);
      console.log('Ответ от сервера:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
  
  generateDocumentation: async (projectId) => {
    try {
      const response = await api.post(`/projects/${projectId}/generate-docs`);
      return response.data;
    } catch (error) {
      console.error(`Error generating documentation for project ${projectId}:`, error);
      throw error;
    }
  },
  
  getDocumentation: async (projectId) => {
    try {
      console.log(`Отправляем запрос на получение документации для проекта ${projectId}...`);
      const response = await api.get(`/projects/${projectId}/documentation`);
      console.log(`Получен ответ:`, response);
      return response.data;
    } catch (error) {
      console.error(`Error fetching documentation for project ${projectId}:`, error);
      throw error;
    }
  }
};

export default api; 