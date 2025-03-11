import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { projectsApi } from '../services/api';
import '../styles/Documentation.css';

const Documentation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [documentation, setDocumentation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    fetchData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const projectData = await projectsApi.getProject(id);
      const docData = await projectsApi.getDocumentation(id);
      
      setProject(projectData);
      setDocumentation(docData);
      setError(null);
    } catch (err) {
      setError('Failed to load documentation');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    if (!documentation || !documentation.content) {
      return <div className="no-content">No documentation content available</div>;
    }
    
    const content = documentation.content;
    
    switch (activeTab) {
      case 'overview':
        return (
          <div className="overview-content">
            <h2>Project Overview</h2>
            <div className="project-info">
              <h3>{content.projectInfo?.name || project.name}</h3>
              <p>{content.projectInfo?.description || 'No description available'}</p>
              
              {content.readme && (
                <div className="readme-section">
                  <h3>README</h3>
                  <ReactMarkdown>{content.readme}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'structure':
        return (
          <div className="structure-content">
            <h2>Project Structure</h2>
            {content.structure && (
              <>
                <h3>Directories</h3>
                <ul className="directory-list">
                  {content.structure.directories.map((dir, index) => (
                    <li key={index}>{dir}</li>
                  ))}
                </ul>
                
                <h3>Files</h3>
                <ul className="file-list">
                  {content.structure.files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );
        
      case 'api':
        return (
          <div className="api-content">
            <h2>API Documentation</h2>
            {content.api && content.api.length > 0 ? (
              <div className="api-list">
                {content.api.map((item, index) => (
                  <div key={index} className="api-item">
                    <h3>{item.name}</h3>
                    <p className="api-description">{item.description}</p>
                    <p className="api-file">File: {item.file}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No API documentation available</p>
            )}
          </div>
        );
        
      case 'components':
        return (
          <div className="components-content">
            <h2>Components</h2>
            {content.components && content.components.length > 0 ? (
              <div className="component-list">
                {content.components.map((component, index) => (
                  <div key={index} className="component-item">
                    <h3>{component.name}</h3>
                    <p className="component-file">File: {component.file}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No components documentation available</p>
            )}
          </div>
        );
        
      case 'dependencies':
        return (
          <div className="dependencies-content">
            <h2>Dependencies</h2>
            {content.projectInfo?.dependencies && content.projectInfo.dependencies.length > 0 ? (
              <div className="dependency-list">
                <h3>Production Dependencies</h3>
                <ul>
                  {content.projectInfo.dependencies.map((dep, index) => (
                    <li key={index}>
                      <strong>{dep.name}</strong>: {dep.version}
                    </li>
                  ))}
                </ul>
                
                {content.projectInfo.devDependencies && content.projectInfo.devDependencies.length > 0 && (
                  <>
                    <h3>Development Dependencies</h3>
                    <ul>
                      {content.projectInfo.devDependencies.map((dep, index) => (
                        <li key={index}>
                          <strong>{dep.name}</strong>: {dep.version}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ) : (
              <p>No dependencies information available</p>
            )}
          </div>
        );
        
      default:
        return <div>Select a tab to view documentation</div>;
    }
  };
  
  if (isLoading) {
    return <div className="loading">Loading documentation...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!documentation) {
    return (
      <div className="not-found">
        <p>Documentation not found. You need to generate documentation first.</p>
        <button 
          className="generate-button"
          onClick={() => navigate(`/projects/${id}`)}
        >
          Go to Project
        </button>
      </div>
    );
  }
  
  return (
    <div className="documentation-container">
      <div className="documentation-header">
        <h1>Documentation: {project.name}</h1>
        <div className="documentation-meta">
          <p>
            <strong>Version:</strong> {documentation.version}
          </p>
          <p>
            <strong>Generated:</strong> {new Date(documentation.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className="documentation-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'structure' ? 'active' : ''}`}
          onClick={() => setActiveTab('structure')}
        >
          Structure
        </button>
        <button 
          className={`tab-button ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          API
        </button>
        <button 
          className={`tab-button ${activeTab === 'components' ? 'active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          Components
        </button>
        <button 
          className={`tab-button ${activeTab === 'dependencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('dependencies')}
        >
          Dependencies
        </button>
      </div>
      
      <div className="documentation-content">
        {renderContent()}
      </div>
      
      <div className="documentation-actions">
        <button 
          className="back-button"
          onClick={() => navigate(`/projects/${id}`)}
        >
          Back to Project
        </button>
        <button 
          className="regenerate-button"
          onClick={() => navigate(`/projects/${id}`)}
        >
          Regenerate Documentation
        </button>
      </div>
    </div>
  );
};

export default Documentation; 