import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(email, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
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
            Create Account
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
                autoComplete="new-password"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                whileFocus={{ boxShadow: "0 0 8px rgba(74, 108, 247, 0.6)" }}
              />
            </div>
            
            <div className="form-group">
              <motion.label 
                htmlFor="confirmPassword"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                Confirm Password
              </motion.label>
              <motion.input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                whileFocus={{ boxShadow: "0 0 8px rgba(74, 108, 247, 0.6)" }}
              />
            </div>
            
            <motion.button 
              type="submit" 
              className="auth-button" 
              disabled={isLoading}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <div className="spinner-small"></div>
              ) : (
                'Register'
              )}
            </motion.button>
          </motion.form>
          
          <motion.div 
            className="auth-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            Already have an account? <Link to="/login" className="highlight-link">Login</Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register; 