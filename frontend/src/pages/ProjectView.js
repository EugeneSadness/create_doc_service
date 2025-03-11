import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../services/api';
import '../styles/ProjectView.css';

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    fetchProject();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const data = await projectsApi.getProject(id);
      setProject(data);
      setError(null);
    } catch (err) {
      setError('Failed to load project');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateDocumentation = async () => {
    try {
      setIsGenerating(true);
      await projectsApi.generateDocumentation(id);
      await fetchProject();
      navigate(`/projects/${id}/documentation`);
    } catch (err) {
      setError('Failed to generate documentation');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (isLoading) {
    return <div className="loading">Loading project...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!project) {
    return <div className="not-found">Project not found</div>;
  }
  
  return (
    <div className="project-view-container">
      <div className="project-header">
        <h1>{project.name}</h1>
        <div className="project-meta">
          <p className="repo-url">
            <strong>Repository:</strong> {project.repository_url}
          </p>
          <p className="created-at">
            <strong>Added on:</strong> {new Date(project.created_at).toLocaleDateString()}
          </p>
          {project.last_analyzed_at && (
            <p className="analyzed-at">
              <strong>Last analyzed:</strong> {new Date(project.last_analyzed_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      
      <div className="project-actions">
        {project.last_analyzed_at ? (
          <button 
            className="view-docs-button"
            onClick={() => navigate(`/projects/${id}/documentation`)}
          >
            View Documentation
          </button>
        ) : null}
        
        <button 
          className="generate-button"
          onClick={handleGenerateDocumentation}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : (project.last_analyzed_at ? 'Regenerate Documentation' : 'Generate Documentation')}
        </button>
      </div>
      
      {isGenerating && (
        <div className="generation-info">
          <p>Generating documentation for your project. This may take a few minutes depending on the size of your repository.</p>
          <div className="progress-indicator"></div>
        </div>
      )}
      
      <div className="back-link">
        <button onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ProjectView; 