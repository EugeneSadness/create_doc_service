import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import Documentation from './pages/Documentation';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import './App.css';

// Включаем флаги будущих версий React Router
const router = createBrowserRouter(
  [
    {
      path: "*",
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    }
  ]
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app">
          <ParticleBackground />
          <Navbar />
          <main className="content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id" 
                element={
                  <ProtectedRoute>
                    <ProjectView />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/documentation" 
                element={
                  <ProtectedRoute>
                    <Documentation />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 