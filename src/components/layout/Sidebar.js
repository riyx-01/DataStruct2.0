import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Code, 
  Trophy, 
  User, 
  LogOut,
  Database,
  Menu,
  X,
  Terminal
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ user, setUser }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/code-visualizer', icon: Code, label: 'Code Visualizer' },
    { path: '/sandbox', icon: Terminal, label: 'Sandbox Challenges' },
    { path: '/quiz', icon: Trophy, label: 'Quiz' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const dataStructures = [
    // Linear
    { path: '/visualizer/array', label: 'Static Array' },
    { path: '/visualizer/dynamic_array', label: 'Dynamic Array' },
    { path: '/visualizer/stack', label: 'Stack' },
    { path: '/visualizer/queue', label: 'Queue' },
    { path: '/visualizer/circular_queue', label: 'Circular Queue' },
    { path: '/visualizer/linkedlist', label: 'Singly Linked List' },
    { path: '/visualizer/doubly_linkedlist', label: 'Doubly Linked List' },
    { path: '/visualizer/circular_linkedlist', label: 'Circular Linked List' },
    // Trees
    { path: '/visualizer/tree', label: 'Binary Tree' },
    { path: '/visualizer/bst', label: 'Binary Search Tree' },
    { path: '/visualizer/heap', label: 'Max Heap' },
    { path: '/visualizer/minheap', label: 'Min Heap' },
    // Graphs & Hashes
    { path: '/visualizer/graph', label: 'Graph (Adj List)' },
    { path: '/visualizer/graph_matrix', label: 'Graph (Adj Matrix)' },
    { path: '/visualizer/hashtable', label: 'Hash Table' }
  ];

  return (
    <motion.aside 
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      className="sidebar"
    >
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">DS</div>
          <div className="logo-text">
            <span className="brand">DataStruct</span>
            <span className="tagline">Learn Visually</span>
          </div>
        </div>
      </div>

      <div className="user-profile-mini">
        <div className="avatar">
          {(() => {
            const saved = localStorage.getItem('currentUser');
            const u = saved ? JSON.parse(saved) : null;
            const avatarUrl = u?.avatar || null;
            return avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : <span>{user?.name?.[0] || 'U'}</span>;
          })()}
        </div>
        <div className="user-info">
          <span className="name">{user?.name || 'User'}</span>
          <span className="email">{user?.email || 'user@example.com'}</span>
        </div>
      </div>

      <nav className="main-nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="ds-section">
        <h3>Data Structures</h3>
        <div className="ds-list">
          {dataStructures.map((ds) => (
            <NavLink 
              key={ds.path} 
              to={ds.path}
              className={({ isActive }) => `ds-item ${isActive ? 'active' : ''}`}
            >
              <Database size={16} />
              <span>{ds.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem' }}>
        <button 
          onClick={() => setUser(null)}
          className="logout-btn"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
            padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;