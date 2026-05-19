import React, { useState, useEffect } from 'react';
// Force reload to clear background engine cache explicitly
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import VisualizerPage from './pages/VisualizerPage';
import CodeVisualizerPage from './pages/CodeVisualizerPage';
import Profile from './pages/Profile';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import BookReader from './pages/BookReader';
import SandboxChallenges from './pages/SandboxChallenges'; // New WASM execution block

import './App.css';

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  );
};

function AppContent({ user, setUser }) {
  const location = useLocation();

  return (
    <div className="app">
      <Sidebar user={user} setUser={setUser} />
      <div className="main-content with-sidebar">
        <AnimatePresence mode='wait'>
          <Routes location={location} key={location.pathname}>
            <Route path="/dashboard" element={<PageWrapper><Dashboard user={user} /></PageWrapper>} />
            <Route path="/visualizer/:type" element={<PageWrapper><VisualizerPage /></PageWrapper>} />
            <Route path="/code-visualizer" element={<PageWrapper><CodeVisualizerPage /></PageWrapper>} />
            <Route path="/quiz" element={<PageWrapper><Quiz /></PageWrapper>} />
            <Route path="/sandbox" element={<PageWrapper><SandboxChallenges /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><Profile user={user} setUser={setUser} /></PageWrapper>} />
            <Route path="/reader/:type" element={<PageWrapper><BookReader /></PageWrapper>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

function App() {
  // Persistent session logic
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  if (!user) {
    return (
      <AnimatePresence>
        <Login onLogin={setUser} />
      </AnimatePresence>
    );
  }

  return (
    <Router>
      <AppContent user={user} setUser={setUser} />
    </Router>
  );
}

export default App;