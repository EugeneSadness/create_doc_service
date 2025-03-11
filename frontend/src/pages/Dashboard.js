import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', repository_url: '' });
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const data = await projectsApi.getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddProject = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const createdProject = await projectsApi.createProject(newProject);
      setProjects(prev => [...prev, createdProject]);
      setNewProject({ name: '', repository_url: '' });
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to create project');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && projects.length === 0) {
    return <div className="loading">Loading projects...</div>;
  }
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Projects</h1>
        <button 
          className="add-project-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Project'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {showAddForm && (
        <div className="add-project-form">
          <h2>Add New Project</h2>
          <form onSubmit={handleAddProject}>
            <div className="form-group">
              <label htmlFor="name">Project Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newProject.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="repository_url">Repository URL</label>
              <input
                type="url"
                id="repository_url"
                name="repository_url"
                value={newProject.repository_url}
                onChange={handleInputChange}
                placeholder="https://github.com/username/repo"
                required
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button" 
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Project'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {projects.length === 0 ? (
        <div className="no-projects">
          <p>You don't have any projects yet.</p>
          <button 
            className="add-project-button"
            onClick={() => setShowAddForm(true)}
          >
            Add Your First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <h3>{project.name}</h3>
              <p className="repo-url">{project.repository_url}</p>
              <p className="created-at">
                Added on {new Date(project.created_at).toLocaleDateString()}
              </p>
              <div className="project-actions">
                <Link 
                  to={`/projects/${project.id}`} 
                  className="view-button"
                >
                  View Project
                </Link>
                {project.last_analyzed_at ? (
                  <Link 
                    to={`/projects/${project.id}/documentation`} 
                    className="docs-button"
                  >
                    View Documentation
                  </Link>
                ) : (
                  <Link 
                    to={`/projects/${project.id}`} 
                    className="generate-button"
                  >
                    Generate Documentation
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 