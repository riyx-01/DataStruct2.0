import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Password strength calculator
  useEffect(() => {
    let strength = 0;
    if (password.length > 7) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength < 50) return '#f87171';
    if (passwordStrength < 75) return '#fbbf24';
    return '#34d399';
  };
  
  const getStrengthLabel = () => {
    if (password === '') return '';
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

    setTimeout(() => {
      if (isSignUp) {
        // Sign Up Validation Flow
        if (!firstName || !lastName) {
          setError('Please provide your full name.');
          setIsLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters long.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        if (!agreedToTerms) {
          setError('You must agree to the Terms & Conditions.');
          setIsLoading(false);
          return;
        }
        if (users.find(u => u.email === email)) {
          setError('User already exists with this email.');
          setIsLoading(false);
          return;
        }

        const newUser = { 
          name: `${firstName} ${lastName}`, 
          email, 
          password, 
          avatar: `https://api.dicebear.com/9.x/adventurer/svg?seed=${firstName}`
        };
        users.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        onLogin(newUser);
      } else {
        // Login Flow
        const user = users.find(u => u.email === email && u.password === password);
        if (user || (email === 'riya@gmail.com' && password === '12345')) {
          onLogin(user || { name: 'Riya Vinod Thakur', email: 'riya@gmail.com', avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Riya' });
        } else {
          setError('Invalid email or password.');
        }
      }
      setIsLoading(false);
    }, 1200);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
  };

  return (
    <div className="login-container">

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="login-card"
      >
        <div className="login-header">
          <div className="login-logo">
            <Database size={32} color="#ffffff" />
          </div>
          <h1>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h1>
          <p>{isSignUp ? 'Join us to start learning data structures' : 'Sign in to continue your progress'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>First Name</label>
                <div className="input-wrapper">
                  <User size={20} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Last Name</label>
                <div className="input-wrapper">
                  <User size={20} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                placeholder="riya@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {isSignUp && password.length > 0 && (
              <div>
                <div className="password-strength">
                  <div 
                    className="password-strength-fill" 
                    style={{ width: `${passwordStrength}%`, background: getStrengthColor() }}
                  ></div>
                </div>
                <div className="password-strength-text" style={{ color: getStrengthColor() }}>
                  {getStrengthLabel()}
                </div>
              </div>
            )}
          </div>

          {isSignUp && (
            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={isSignUp}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          <div className="form-options">
            {isSignUp ? (
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  checked={agreedToTerms} 
                  onChange={(e) => setAgreedToTerms(e.target.checked)} 
                  required
                />
                I agree to the Terms & Conditions
              </label>
            ) : (
              <>
                <label className="remember-me">
                  <input type="checkbox" />
                  Remember me
                </label>
                <a href="#" className="forgot-password">Forgot password?</a>
              </>
            )}
          </div>

          {error && <div className="login-error-msg">{error}</div>}

          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Processing securely...' : (isSignUp ? 'Create Account' : 'Sign In to Dashboard')}
          </button>
        </form>

        <div className="login-footer">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"} 
          <button onClick={toggleMode} className="toggle-auth">
            {isSignUp ? 'Sign In' : 'Register Now'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;