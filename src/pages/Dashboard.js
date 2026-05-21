import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Trophy,
  Activity, BookOpen, Calendar, Clock, ChevronRight, Zap
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({ visualizations: 0, quizzesTaken: 0, avgScore: 0, history: [], visualizersVisited: {} });

  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem('userStats'));
    if (savedStats) {
      setUserStats({
        visualizations: 0,
        quizzesTaken: 0,
        avgScore: 0,
        history: [],
        visualizersVisited: {},
        ...savedStats,
      });
    }
  }, []);

  const visitedVisualizers = userStats.visualizersVisited || {};
  const quizScoreFactor = userStats.quizzesTaken > 0 ? Math.max(0.35, (Number(userStats.avgScore) || 0) / 100) : 0;
  const quizCredit = Math.min(30, userStats.quizzesTaken * 10 * quizScoreFactor);
  const getCategoryProgress = (structures) => {
    const visitedCount = structures.filter((structure) => visitedVisualizers[structure]).length;
    const visualizerCredit = structures.length ? (visitedCount / structures.length) * 70 : 0;
    return {
      progress: Math.min(100, Math.round(visualizerCredit + quizCredit)),
      detail: `${visitedCount}/${structures.length} visualizers explored`
    };
  };

  const summaryStats = [
    { label: 'Completed Quizzes', value: userStats.quizzesTaken.toString(), icon: Trophy, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { label: 'Average Quiz Score', value: `${userStats.avgScore}%`, icon: Clock,   color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Visualizations Run', value: userStats.visualizations.toString(), icon: Zap,  color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: 'Active Streak',     value: `${Math.max(1, userStats.visualizations + userStats.quizzesTaken)} Day${Math.max(1, userStats.visualizations + userStats.quizzesTaken) > 1 ? 's' : ''}`, icon: Users,   color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  ];

  const recentActivity = userStats.history.length > 0
    ? userStats.history.slice(0, 4).map((h, i) => ({
        action: `Completed Quiz: ${h.topic}`,
        desc: `Scored ${h.score} on the evaluation module`,
        time: h.date || 'Recent',
        color: h.score && parseInt(h.score) >= 70 ? '#10b981' : '#f59e0b'
      }))
    : [
        { action: 'Mastered Binary Search Tree', desc: 'Completed visualization & quiz with 90%', time: '2h ago', color: '#10b981' },
        { action: 'Read: Memory Management',     desc: 'Deep-dive in Code Visualizer notebook', time: '5h ago', color: '#3b82f6' },
        { action: 'Practice: Circular Queue',    desc: 'Implemented 15+ insert/delete operations', time: 'Yesterday', color: '#f59e0b' },
        { action: 'Quiz: Hash Tables',           desc: 'Scored 80% on Hash Table challenge', time: '2 days ago', color: '#ef4444' },
      ];

  const progressCatalog = [
    { name: 'Linear Data Structures', structures: ['array', 'dynamic_array', 'stack', 'queue', 'circular_queue', 'linkedlist', 'doubly_linkedlist', 'circular_linkedlist'], color: '#3b82f6' },
    { name: 'Trees & Heaps', structures: ['tree', 'bst', 'avl', 'heap', 'minheap', 'trie'], color: '#8b5cf6' },
    { name: 'Graphs & Hashing', structures: ['graph', 'hashtable', 'bloom', 'disjoint'], color: '#f59e0b' },
    { name: 'Quiz Mastery', structures: [], color: '#10b981', progress: Math.min(100, Math.round(userStats.quizzesTaken * 20 * quizScoreFactor)), detail: `${userStats.quizzesTaken} quiz${userStats.quizzesTaken === 1 ? '' : 'zes'} completed` },
  ];

  const courses = progressCatalog.map((category) => {
    if (typeof category.progress === 'number') return category;
    return {
      ...category,
      ...getCategoryProgress(category.structures)
    };
  });

  const quickLinks = [
    { label: 'Array',       path: '/visualizer/array' },
    { label: 'Stack',       path: '/visualizer/stack' },
    { label: 'Queue',       path: '/visualizer/queue' },
    { label: 'Linked List', path: '/visualizer/linkedlist' },
    { label: 'BST',         path: '/visualizer/bst' },
    { label: 'Graph',       path: '/visualizer/graph' },
  ];

  return (
    <div className="dash-root">

      {/* ── WELCOME BANNER ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="dash-banner">
        <div>
          <h1 className="dash-greeting">Welcome back, {user?.name?.split(' ')[0] || 'Scholar'} 👋</h1>
          <p className="dash-sub">Here's your learning snapshot for today</p>
        </div>
        <div className="dash-date">
          <Calendar size={16} />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      <div className="dash-stat-row">
        {summaryStats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="dash-stat-card"
          >
            <div className="dash-stat-icon" style={{ background: s.bg, color: s.color }}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="dash-stat-label">{s.label}</p>
              <p className="dash-stat-value">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="dash-main-grid">

        {/* Progress panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title"><BookOpen size={18} /> Learning Progress</span>
            <button className="dash-view-all" onClick={() => navigate('/visualizer/array')}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="dash-progress-list">
            {courses.map((c, i) => (
              <div key={i} className="dash-progress-item">
                <div className="dash-progress-meta">
                  <span>{c.name}</span>
                  <span style={{ color: c.color, fontWeight: 700 }}>{c.progress}%</span>
                </div>
                <div className="dash-progress-detail">{c.detail}</div>
                <div className="dash-progress-track">
                  <motion.div
                    className="dash-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                    style={{ background: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="dash-panel-header" style={{ marginTop: '28px' }}>
            <span className="dash-panel-title"><Zap size={18} /> Quick Jump</span>
          </div>
          <div className="dash-quick-grid">
            {quickLinks.map(l => (
              <button key={l.label} className="dash-quick-btn" onClick={() => navigate(l.path)}>
                {l.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Activity feed */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title"><Activity size={18} /> Recent Activity</span>
          </div>
          <div className="dash-activity-list">
            {recentActivity.map((a, i) => (
              <div key={i} className="dash-activity-item">
                <div className="dash-activity-dot" style={{ background: a.color }} />
                <div className="dash-activity-body">
                  <p className="dash-activity-title">{a.action}</p>
                  <p className="dash-activity-desc">{a.desc}</p>
                  <p className="dash-activity-time"><Clock size={11} /> {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;
