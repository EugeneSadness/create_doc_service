import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { projectsApi } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    repository_url: '',
    description: ''
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('Отправляем запрос на получение списка проектов...');
      console.log('Токен авторизации:', localStorage.getItem('token'));
      const response = await projectsApi.getProjects();
      console.log('Получен список проектов:', response);
      setProjects(response);
      console.log('Список проектов установлен в состояние:', response);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newProject.name || !newProject.repository_url) {
      setFormError('Project name and repository URL are required');
      return;
    }
    
    try {
      setFormLoading(true);
      setFormError(null);
      console.log('Отправляем запрос на создание проекта:', newProject);
      const createdProject = await projectsApi.createProject(newProject);
      console.log('Проект успешно создан:', createdProject);
      setNewProject({
        name: '',
        repository_url: '',
        description: ''
      });
      setShowForm(false);
      console.log('Обновляем список проектов...');
      await fetchProjects();
      console.log('Список проектов обновлен');
    } catch (err) {
      setFormError('Failed to create project. Please check your inputs and try again.');
      console.error('Error creating project:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleGenerateDocumentation = async (projectId) => {
    try {
      await projectsApi.generateDocumentation(projectId);
      navigate(`/projects/${projectId}/documentation`);
    } catch (err) {
      console.error('Error generating documentation:', err);
      alert('Failed to generate documentation. Please try again later.');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 1 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100 
      }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25 
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.2 
      }
    }
  };

  return (
    <motion.div 
      className="dashboard-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="dashboard-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h1>My Projects</h1>
        <motion.button 
          className="add-project-button"
          onClick={() => setShowForm(!showForm)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showForm ? 'Cancel' : 'Add Project'}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.form 
            className="add-project-form"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onSubmit={handleSubmit}
          >
            <h2>Create New Project</h2>
            
            {formError && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {formError}
              </motion.div>
            )}
            
            <div className="form-group">
              <label htmlFor="name">Project Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newProject.name}
                onChange={handleInputChange}
                placeholder="Enter project name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="repository_url">Repository URL</label>
              <input
                type="text"
                id="repository_url"
                name="repository_url"
                value={newProject.repository_url}
                onChange={handleInputChange}
                placeholder="https://github.com/username/repo"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <input
                type="text"
                id="description"
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                placeholder="Brief description of your project"
              />
            </div>
            
            <div className="form-actions">
              <motion.button 
                type="submit" 
                className="submit-button"
                disabled={formLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {formLoading ? 'Creating...' : 'Create Project'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <motion.div 
          className="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Loading projects...
        </motion.div>
      ) : error ? (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      ) : projects.length === 0 ? (
        <motion.div 
          className="no-projects"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p>You don't have any projects yet.</p>
          <motion.button 
            className="add-project-button"
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Your First Project
          </motion.button>
        </motion.div>
      ) : (
        <motion.div 
          className="projects-grid"
          variants={containerVariants}
          initial="visible"
          animate="visible"
        >
          {projects.map(project => (
            <motion.div 
              key={project.id} 
              className="project-card"
              variants={itemVariants}
              initial="visible"
              animate="visible"
              whileHover={{ 
                y: -10,
                transition: { duration: 0.2 }
              }}
            >
              <h3>{project.name}</h3>
              {project.repository_url && (
                <div className="repo-url">
                  {project.repository_url}
                </div>
              )}
              {project.description && (
                <p>{project.description}</p>
              )}
              <div className="created-at">
                Created on {formatDate(project.created_at)}
              </div>
              <div className="project-actions">
                <Link to={`/projects/${project.id}`} className="view-button">
                  View Details
                </Link>
                {project.has_documentation ? (
                  <Link to={`/projects/${project.id}/documentation`} className="docs-button">
                    View Documentation
                  </Link>
                ) : (
                  <motion.button
                    className="generate-button"
                    onClick={() => handleGenerateDocumentation(project.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Generate Documentation
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard; 