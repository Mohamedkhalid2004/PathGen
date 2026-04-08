import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import '../css/Login.css';
import { login } from '../lib/api';

interface Props {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<Props> = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      onLogin();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid username or password';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-image-side">
        <div className="image-overlay"></div>
        <img
          src="/images/carrer-path.png"
          alt="Career Path Illustration"
          className="login-background-image"
        />
        <div className="image-content">
          <div className="image-text">
            <h2 className="image-title">Your Learning Journey Starts Here</h2>
            <p className="image-subtitle">
              Unlock your potential with personalized learning paths
            </p>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <div className="form-wrapper">
          <div className="login-header">
            <div className="login-icon">
              <LogIn size={32} />
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">
              Sign in to continue your learning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Username
              </label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} />
                Password
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              <LogIn size={18} />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="divider">
              <span className="divider-text">Need help?</span>
            </div>

            <div className="demo-box">
              <p>Register first if you don't have an account, then login with your credentials.</p>
            </div>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <button onClick={onSwitchToRegister} className="link-button">
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
