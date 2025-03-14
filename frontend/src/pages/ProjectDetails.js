import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { projectsApi } from '../services/api';
import '../styles/ProjectDetails.css';
import ParticleBackground from '../components/ParticleBackground';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getProject(id);
      setProject(response);
      setError(null);
    } catch (err) {
      setError('Failed to load project details. Please try again later.');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocumentation = async () => {
    try {
      setLoading(true);
      await projectsApi.generateDocumentation(id);
      setSuccessMessage('Documentation generated successfully!');
      fetchProject();
    } catch (err) {
      setError('Failed to generate documentation. Please try again later.');
      console.error('Error generating documentation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/projects/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to delete project. Please try again later.');
      console.error('Error deleting project:', err);
      setShowDeleteModal(false);
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && !project) {
    return (
      <motion.div 
        className="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Loading project details...
      </motion.div>
    );
  }

  if (error && !project) {
    return (
      <motion.div 
        className="error-message"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {error}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="project-details-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ParticleBackground />
      
      <motion.div 
        className="project-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h1>{project.name}</h1>
        <Link to="/dashboard" className="back-button">
          Back to Dashboard
        </Link>
      </motion.div>

      {successMessage && (
        <motion.div 
          className="success-message"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {successMessage}
        </motion.div>
      )}

      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}

      <motion.div 
        className="project-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="project-info">
          <div className="info-item">
            <h3>Repository URL</h3>
            <p>{project.repository_url || 'Not specified'}</p>
          </div>
          
          <div className="info-item">
            <h3>Created At</h3>
            <p>{formatDate(project.created_at)}</p>
          </div>
          
          <div className="info-item">
            <h3>Last Updated</h3>
            <p>{formatDate(project.updated_at || project.created_at)}</p>
          </div>
          
          <div className="info-item">
            <h3>Documentation Status</h3>
            <p>{project.has_documentation ? 'Generated' : 'Not generated'}</p>
          </div>
          
          {project.description && (
            <div className="info-item">
              <h3>Description</h3>
              <p>{project.description}</p>
            </div>
          )}
        </div>
        
        <motion.div 
          className="project-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {project.has_documentation ? (
            <Link 
              to={`/projects/${project.id}/documentation`} 
              className="action-button primary-button"
            >
              View Documentation
            </Link>
          ) : (
            <motion.button
              className="action-button secondary-button"
              onClick={handleGenerateDocumentation}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Generating...' : 'Generate Documentation'}
            </motion.button>
          )}
          
          <motion.button
            className="action-button danger-button"
            onClick={() => setShowDeleteModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Delete Project
          </motion.button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button 
                className="close-button" 
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
              
              <div className="modal-header">
                <h2>Delete Project</h2>
              </div>
              
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone.</p>
              </div>
              
              <div className="modal-actions">
                <motion.button
                  className="action-button primary-button"
                  onClick={() => setShowDeleteModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  className="action-button danger-button"
                  onClick={handleDeleteProject}
                  disabled={deleteLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectDetails; 