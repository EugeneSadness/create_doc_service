import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    // Проверяем сохраненную тему в localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.body.classList.add('dark-theme');
    }
    
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
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
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <motion.nav 
      className={`navbar ${scrolled ? 'scrolled' : ''} ${isDarkTheme ? 'dark-theme' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="navbar-container">
        <motion.div 
          className="navbar-brand"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/">
            <span className="brand-text">DocGen</span>
            <span className="brand-dot"></span>
          </Link>
        </motion.div>
        
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <motion.div 
                className="navbar-item"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/" 
                  className={location.pathname === '/' ? 'active' : ''}
                >
                  Dashboard
                </Link>
              </motion.div>
              
              <motion.div 
                className="user-info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="user-email">{user?.email}</span>
              </motion.div>
              
              <motion.div 
                className="theme-toggle-container"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <button 
                  className="theme-toggle-button"
                  onClick={toggleTheme}
                >
                  {isDarkTheme ? (
                    <span className="theme-icon">☀️</span>
                  ) : (
                    <span className="theme-icon">🌙</span>
                  )}
                </button>
              </motion.div>
              
              <motion.div 
                className="navbar-item"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <button 
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div 
                className="navbar-item"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/login"
                  className={location.pathname === '/login' ? 'active' : ''}
                >
                  Login
                </Link>
              </motion.div>
              
              <motion.div 
                className="navbar-item"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/register"
                  className={location.pathname === '/register' ? 'active' : ''}
                >
                  Register
                </Link>
              </motion.div>
              
              <motion.div 
                className="theme-toggle-container"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <button 
                  className="theme-toggle-button"
                  onClick={toggleTheme}
                >
                  {isDarkTheme ? (
                    <span className="theme-icon">☀️</span>
                  ) : (
                    <span className="theme-icon">🌙</span>
                  )}
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar; 