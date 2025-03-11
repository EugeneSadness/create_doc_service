import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const projectsApi = {
  getProjects: async () => {
    try {
      const response = await axios.get(`${API_URL}/projects`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },
  
  getProject: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw error;
    }
  },
  
  createProject: async (projectData) => {
    try {
      const response = await axios.post(`${API_URL}/projects`, projectData);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
  
  generateDocumentation: async (projectId) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${projectId}/generate`);
      return response.data;
    } catch (error) {
      console.error(`Error generating documentation for project ${projectId}:`, error);
      throw error;
    }
  },
  
  getDocumentation: async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/documentation`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching documentation for project ${projectId}:`, error);
      throw error;
    }
  }
}; 