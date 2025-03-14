import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      <motion.div 
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="auth-card glass-effect"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.h2 
            className="glow-text"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Login
          </motion.h2>
          
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
          
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="form-group">
              <motion.label 
                htmlFor="email"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Email
              </motion.label>
              <motion.input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                whileFocus={{ boxShadow: "0 0 8px rgba(74, 108, 247, 0.6)" }}
              />
            </div>
            
            <div className="form-group">
              <motion.label 
                htmlFor="password"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Password
              </motion.label>
              <motion.input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                whileFocus={{ boxShadow: "0 0 8px rgba(74, 108, 247, 0.6)" }}
              />
            </div>
            
            <motion.button 
              type="submit" 
              className="auth-button" 
              disabled={isLoading}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <div className="spinner-small"></div>
              ) : (
                'Login'
              )}
            </motion.button>
          </motion.form>
          
          <motion.div 
            className="auth-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            Don't have an account? <Link to="/register" className="highlight-link">Register</Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login; 