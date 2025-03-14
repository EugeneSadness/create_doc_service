import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import ReactMarkdown from 'react-markdown';
import api, { projectsApi } from '../services/api';
import '../styles/Documentation.css';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    const particlesArray = [];
    const numberOfParticles = 50;
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 15 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.color = `hsl(${Math.random() * 60 + 200}, 70%, 50%)`;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.size > 0.2) this.size -= 0.05;

        if (this.x < 0 || this.x > canvas.width) {
          this.speedX = -this.speedX;
        }
        
        if (this.y < 0 || this.y > canvas.height) {
          this.speedY = -this.speedY;
        }
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
      }
    }
    
    const init = () => {
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };
    
    init();
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();

        for (let j = i; j < particlesArray.length; j++) {
          const dx = particlesArray[i].x - particlesArray[j].x;
          const dy = particlesArray[i].y - particlesArray[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(74, 108, 247, ${0.2 - distance/500})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
            ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
            ctx.stroke();
          }
        }

        if (particlesArray[i].size <= 0.2) {
          particlesArray.splice(i, 1);
          i--;
          particlesArray.push(new Particle());
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="particle-background"
    />
  );
};

const ThemeToggle = ({ isDarkTheme, toggleTheme }) => {
  return (
    <motion.div 
      className="theme-toggle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <motion.button 
        className={`theme-toggle-button ${isDarkTheme ? 'dark' : 'light'}`}
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isDarkTheme ? (
          <span className="theme-icon">☀️</span>
        ) : (
          <span className="theme-icon">🌙</span>
        )}
      </motion.button>
    </motion.div>
  );
};

const Documentation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState({});
  const [documentation, setDocumentation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const headerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.body.classList.add('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    if (!isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        

        const projectData = await projectsApi.getProject(id);
        setProject(projectData);
        console.log('Project data:', projectData);

        const docData = await projectsApi.getDocumentation(id);
        console.log('Documentation data:', docData);

        if (docData && typeof docData.content === 'string') {
          try {

            const parsedContent = JSON.parse(docData.content);
            docData.content = parsedContent;
          } catch (e) {
            console.error('Failed to parse documentation content:', e);
          }
        }
        
        setDocumentation(docData);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching documentation:', err);
        setError(err.response?.data?.error || 'Failed to fetch documentation');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  useEffect(() => {
    if (headerRef.current && !isLoading) {

      gsap.from(headerRef.current.children, {
        y: -50,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out"
      });
    }
  }, [isLoading]);

  const tabVariants = {
    inactive: { opacity: 0.7 },
    active: { 
      opacity: 1,
      scale: 1.05,
      transition: { duration: 0.3 }
    },
    hover: { 
      scale: 1.1,
      transition: { duration: 0.2 }
    }
  };

  const contentVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      transition: { duration: 0.3 }
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2 }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const renderContent = () => {
    if (!documentation) {
      return <div className="no-content">No documentation content available</div>;
    }
    
    console.log('Rendering content with documentation:', documentation);

    if (!documentation.content) {
      return <div className="no-content">Invalid documentation format</div>;
    }
    
    const content = documentation.content;
    console.log('Content to render:', content);
    
    switch (activeTab) {
      case 'overview':
        if (!content.overview && !content.projectInfo) {
          return <div className="no-content">No overview information available</div>;
        }
        
        return (
          <motion.div 
            className="overview-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
          >
            <h2 className="glow-text">Project Overview</h2>
            <div className="project-info card-3d">
              <h3 className="project-title">{content.projectInfo?.name || project.name}</h3>
              
              {content.overview ? (
                <div className="auto-overview">
                  <motion.div 
                    className="overview-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <h4>Project Type</h4>
                    <p className="highlight-text">{content.overview.projectType || 'Unknown'}</p>
                  </motion.div>
                  
                  {content.overview.description && (
                    <motion.div 
                      className="overview-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <h4>Description</h4>
                      <p>{content.overview.description}</p>
                    </motion.div>
                  )}
                  
                  {content.overview.architecture && (
                    <motion.div 
                      className="overview-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      <h4>Architecture</h4>
                      <p>{content.overview.architecture}</p>
                    </motion.div>
                  )}
                  
                  {content.overview.mainFeatures && content.overview.mainFeatures.length > 0 && (
                    <motion.div 
                      className="overview-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      <h4>Main Features</h4>
                      <ul className="features-list">
                        {content.overview.mainFeatures.map((feature, index) => (
                          <motion.li 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                            whileHover={{ scale: 1.03, x: 5 }}
                          >
                            {feature}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                  
                  {content.overview.technologies && content.overview.technologies.length > 0 && (
                    <motion.div 
                      className="overview-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                    >
                      <h4>Technologies</h4>
                      <div className="technologies-list">
                        {content.overview.technologies.map((tech, index) => (
                          <motion.span 
                            key={index} 
                            className="technology-tag"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                            whileHover={{ 
                              scale: 1.1, 
                              boxShadow: "0 5px 15px rgba(0,0,0,0.1)" 
                            }}
                          >
                            {tech}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {content.overview.entryPoints && content.overview.entryPoints.length > 0 && (
                    <motion.div 
                      className="overview-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      <h4>Entry Points</h4>
                      <ul className="entry-points-list">
                        {content.overview.entryPoints.map((entry, index) => (
                          <motion.li 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                            className="entry-point-item"
                          >
                            {entry}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              ) : (
                <p>{content.projectInfo?.description || 'No description available'}</p>
              )}
              
              {content.readme && content.readme !== 'No README.md found in the repository.' && (
                <motion.div 
                  className="readme-section"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <h3>README</h3>
                  <div className="readme-content">
                    <ReactMarkdown>{content.readme}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
        
      case 'structure':
        return (
          <motion.div 
            className="structure-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
          >
            <h2 className="glow-text">Project Structure</h2>
            {content.structure && (
              <div className="structure-container">
                <motion.div 
                  className="structure-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h3>Directories</h3>
                  <ul className="directory-list">
                    {content.structure.directories.map((dir, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
                        whileHover={{ x: 5, color: '#4a6cf7' }}
                        className="directory-item"
                      >
                        <span className="directory-icon">📁</span> {dir}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
                
                <motion.div 
                  className="structure-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <h3>Files</h3>
                  <ul className="file-list">
                    {content.structure.files.map((file, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.03, duration: 0.3 }}
                        whileHover={{ x: 5, color: '#4a6cf7' }}
                        className="file-item"
                      >
                        <span className="file-icon">📄</span> {file}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            )}
          </motion.div>
        );
        
      case 'api':
        return (
          <motion.div 
            className="api-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
          >
            <h2 className="glow-text">API Documentation</h2>
            {content.api && content.api.length > 0 ? (
              <div className="api-list">
                {content.api.map((item, index) => (
                  <motion.div 
                    key={index} 
                    className="api-item card-3d"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  >
                    <h3>{item.name}</h3>
                    <p className="api-description">{item.description}</p>
                    <p className="api-file">
                      <span className="file-label">File:</span> {item.file}
                    </p>
                    {item.params && item.params.length > 0 && (
                      <div className="api-params">
                        <h4>Parameters:</h4>
                        <ul>
                          {item.params.map((param, paramIndex) => (
                            <motion.li 
                              key={paramIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + paramIndex * 0.1, duration: 0.3 }}
                            >
                              {param}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.line && (
                      <p className="api-line">
                        <span className="line-label">Line:</span> {item.line}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.p 
                className="no-data-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                No API documentation available
              </motion.p>
            )}
          </motion.div>
        );
        
      case 'components':
        return (
          <motion.div 
            className="components-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
          >
            <h2 className="glow-text">Components</h2>
            {content.components && content.components.length > 0 ? (
              <div className="component-list">
                {content.components.map((component, index) => (
                  <motion.div 
                    key={index} 
                    className="component-item card-3d"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  >
                    <h3>{component.name}</h3>
                    {component.description && component.description !== 'No description' && (
                      <p className="component-description">{component.description}</p>
                    )}
                    <p className="component-file">
                      <span className="file-label">File:</span> {component.file}
                    </p>
                    {component.props && component.props.length > 0 && (
                      <div className="component-props">
                        <h4>Props:</h4>
                        <ul>
                          {component.props.map((prop, propIndex) => (
                            <motion.li 
                              key={propIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + propIndex * 0.1, duration: 0.3 }}
                            >
                              <span className="prop-name">{prop.name}</span> 
                              {prop.required && <span className="required">*required</span>}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {component.line && (
                      <p className="component-line">
                        <span className="line-label">Line:</span> {component.line}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.p 
                className="no-data-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                No components documentation available
              </motion.p>
            )}
          </motion.div>
        );
        
      case 'classes':
        return (
          <motion.div 
            className="classes-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
          >
            <h2 className="glow-text">Classes</h2>
            {content.classes && content.classes.length > 0 ? (
              <div className="class-list">
                {content.classes.map((cls, index) => (
                  <motion.div 
                    key={index} 
                    className="class-item card-3d"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  >
                    <h3>{cls.name}</h3>
                    <p className="class-description">{cls.description}</p>
                    <p className="class-file">
                      <span className="file-label">File:</span> {cls.file}
                    </p>
                    
                    {cls.methods && cls.methods.length > 0 && (
                      <div className="class-methods">
                        <h4>Methods:</h4>
                        {cls.methods.map((method, methodIndex) => (
                          <motion.div 
                            key={methodIndex} 
                            className="method-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + methodIndex * 0.1, duration: 0.3 }}
                          >
                            <h5 className="method-name">{method.name}({method.params.join(', ')})</h5>
                            <p className="method-description">{method.description}</p>
                            <p className="method-line">
                              <span className="line-label">Line:</span> {method.line}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.p 
                className="no-data-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                No classes documentation available
              </motion.p>
            )}
          </motion.div>
        );
        
      case 'dependencies':
        return (
          <motion.div 
            className="dependencies-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
          >
            <h2 className="glow-text">Dependencies</h2>
            {content.projectInfo?.dependencies && content.projectInfo.dependencies.length > 0 ? (
              <div className="dependency-list">
                <motion.div 
                  className="dependency-section card-3d"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h3>Production Dependencies</h3>
                  <ul>
                    {content.projectInfo.dependencies.map((dep, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
                        whileHover={{ x: 5, backgroundColor: 'rgba(74, 108, 247, 0.05)' }}
                        className="dependency-item"
                      >
                        <strong className="dependency-name">{dep.name}</strong>
                        <span className="dependency-version">{dep.version}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
                
                {content.projectInfo.devDependencies && content.projectInfo.devDependencies.length > 0 && (
                  <motion.div 
                    className="dependency-section card-3d"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <h3>Development Dependencies</h3>
                    <ul>
                      {content.projectInfo.devDependencies.map((dep, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.05, duration: 0.3 }}
                          whileHover={{ x: 5, backgroundColor: 'rgba(74, 108, 247, 0.05)' }}
                          className="dependency-item dev"
                        >
                          <strong className="dependency-name">{dep.name}</strong>
                          <span className="dependency-version">{dep.version}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.p 
                className="no-data-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                No dependencies information available
              </motion.p>
            )}
          </motion.div>
        );
        
      default:
        return <div>Select a tab to view documentation</div>;
    }
  };
  
  if (isLoading) {
    return (
      <div className={`loading-container ${isDarkTheme ? 'dark-theme' : ''}`}>
        <ThemeToggle isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p className="loading-text">Loading documentation...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <motion.div 
        className={`error-container ${isDarkTheme ? 'dark-theme' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ThemeToggle isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
        <div className="error-icon">❌</div>
        <h2>Error</h2>
        <p className="error-message">{error}</p>
        <motion.button 
          className="back-button"
          onClick={() => navigate('/projects')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Projects
        </motion.button>
      </motion.div>
    );
  }
  
  if (!documentation) {
    return (
      <motion.div 
        className={`not-found-container ${isDarkTheme ? 'dark-theme' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ThemeToggle isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
        <div className="not-found-icon">📝</div>
        <h2>Documentation Not Found</h2>
        <p>Documentation not found. You need to generate documentation first.</p>
        <motion.button 
          className="generate-button"
          onClick={() => navigate(`/projects/${id}`)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Go to Project
        </motion.button>
      </motion.div>
    );
  }
  
  return (
    <div className={`page-container ${isDarkTheme ? 'dark-theme' : ''}`}>
      <ThemeToggle isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
      <div className="documentation-container">
        <motion.div 
          className="documentation-header"
          ref={headerRef}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Documentation: {project.name}</h1>
          <div className="documentation-meta">
            <p>
              <strong>Version:</strong> {documentation.version}
            </p>
            <p>
              <strong>Generated:</strong> {new Date(documentation.created_at).toLocaleString()}
            </p>
          </div>
        </motion.div>
        
        <div className="documentation-tabs">
          {['overview', 'structure', 'api', 'components', 'classes', 'dependencies'].map((tab) => (
            <motion.button 
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === tab ? "active" : "inactive"}
              whileHover="hover"
              whileTap={{ scale: 0.95 }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div 
                  className="tab-underline"
                  layoutId="underline"
                />
              )}
            </motion.button>
          ))}
        </div>
        
        <div className="documentation-content" ref={contentRef}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
        
        <motion.div 
          className="documentation-actions"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.button 
            className="back-button"
            onClick={() => navigate('/projects')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Projects
          </motion.button>
          
          <motion.button 
            className="regenerate-button"
            onClick={() => navigate(`/projects/${id}`)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Regenerate Documentation
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Documentation; 