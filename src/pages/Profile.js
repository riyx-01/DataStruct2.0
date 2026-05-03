import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Trophy, Calendar, Edit2, Check, Code, Lock } from 'lucide-react';
import './Profile.css';

const Profile = ({ user, setUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'Riya Vinod Thakur');
  const [email, setEmail] = useState(user?.email || 'riya@gmail.com');
  const [password, setPassword] = useState(user?.password || '');
  
  const avatars = [
    // Boy-style
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Jack',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Leo',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Bear',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Max',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Oliver',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Noah',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Liam',
    // Girl-style
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Sadie',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Lily',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Mia',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Cookie',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Emma',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Sophia',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Zoe',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Ava',
  ];
  
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || avatars[0]);
  const [showAvatars, setShowAvatars] = useState(false);

  const [userStats, setUserStats] = useState({ visualizations: 0, quizzesTaken: 0, avgScore: 0, history: [] });

  useEffect(() => {
    const defaultStats = {
      visualizations: 0, quizzesTaken: 0, avgScore: 0, history: [],
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
    let savedStats = JSON.parse(localStorage.getItem('userStats'));
    if (!savedStats) {
      savedStats = defaultStats;
      localStorage.setItem('userStats', JSON.stringify(defaultStats));
    } else if (!savedStats.joinDate) {
       savedStats.joinDate = defaultStats.joinDate;
       localStorage.setItem('userStats', JSON.stringify(savedStats));
    }
    setUserStats(savedStats);
  }, []);

  const stats = [
    { label: 'Quizzes Taken', value: userStats.quizzesTaken.toString(), icon: Trophy },
    { label: 'Average Score', value: `${userStats.avgScore}%`, icon: Trophy },
    { label: 'Visualizations', value: userStats.visualizations.toString(), icon: Code },
    { label: 'Joined', value: userStats.joinDate, icon: Calendar },
  ];

  const quizHistory = userStats.history.length > 0 ? userStats.history : [
    { topic: 'No quizzes taken yet', score: '-', date: '-' },
  ];

  const handleSave = () => {
    setIsEditing(false);
    
    // 1. Update existing users database
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const updatedUsers = users.map(u => {
      if (u.email === user.email) {
        return { ...u, name, password };
      }
      return u;
    });
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));

    // 2. Update active session (include avatar)
    setUser({ ...user, name, password, avatar: avatarUrl });
    alert('Profile updated successfully!');
  };

  return (
    <div className="profile-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-header"
      >
        <div className="profile-avatar-section">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div className="profile-avatar">
              <img src={avatarUrl} alt="Avatar" />
              <button className="edit-avatar" onClick={() => setShowAvatars(!showAvatars)}>
                <Edit2 size={16} />
              </button>
            </div>
            {showAvatars && (
              <div className="avatar-selector">
                {avatars.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Avatar Option"
                    className="avatar-option"
                    onClick={() => { setAvatarUrl(url); setShowAvatars(false); }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="profile-title">
            {isEditing ? (
              <div className="edit-form">
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="edit-input"
                />
                <button onClick={handleSave} className="save-btn">
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <>
                <h1>{name}</h1>
                <button onClick={() => setIsEditing(true)} className="edit-profile-btn">
                  <Edit2 size={16} /> Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="profile-grid">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="profile-card info-card"
        >
          <h2>Personal Information</h2>
          <div className="info-list">
            <div className="info-item">
              <div>
                <label>Full Name</label>
                <span>{name}</span>
              </div>
            </div>
            <div className="info-item">
              <div>
                <label>Email</label>
                <span>{email}</span>
              </div>
            </div>
            <div className="info-item">
              <div>
                <label>Login Password</label>
                {isEditing ? (
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="edit-input-small"
                    placeholder="New Password"
                  />
                ) : (
                  <span>••••••••</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="profile-card stats-card"
        >
          <h2>Statistics</h2>
          <div className="stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-item">
                <stat.icon size={24} color="#10b981" />
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="profile-card history-card"
        >
          <h2>Quiz History</h2>
          <div className="history-list">
            {quizHistory.map((quiz, idx) => (
              <div key={idx} className="history-item">
                <div className="history-info">
                  <span className="history-topic">{quiz.topic}</span>
                  <span className="history-date">{quiz.date}</span>
                </div>
                <span className="history-score">{quiz.score}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;