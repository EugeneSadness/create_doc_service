import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">DocGen</Link>
      </div>
      
      <div className="navbar-menu">
        {isAuthenticated ? (
          <>
            <div className="navbar-item">
              <Link to="/">Dashboard</Link>
            </div>
            <div className="navbar-item user-info">
              <span>{user?.email}</span>
            </div>
            <div className="navbar-item">
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="navbar-item">
              <Link to="/login">Login</Link>
            </div>
            <div className="navbar-item">
              <Link to="/register">Register</Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 