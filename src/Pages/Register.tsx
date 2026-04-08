import React, { useState } from 'react';
import { UserPlus, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { register } from '../lib/api';

interface Props {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<Props> = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (formData.username.trim().length < 3) {
      newErrors.push('Username must be at least 3 characters');
    }
    if (/\s/.test(formData.username)) {
      newErrors.push('Username cannot contain spaces');
    }
    if (formData.password.length < 6) {
      newErrors.push('Password must be at least 6 characters');
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await register(formData.username.trim(), formData.password);
      setErrors([]);
      setSuccess(true);
      setTimeout(() => {
        onRegister();
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setErrors([message]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <UserPlus size={40} />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join PathFinder+ and start your journey</p>
        </div>

        {success ? (
          <div className="success-message">
            <CheckCircle size={48} />
            <h3>Account Created Successfully!</h3>
            <p>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {errors.length > 0 && (
              <div className="error-message">
                <AlertCircle size={18} />
                <div>
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
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
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Choose a username"
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} />
                Confirm Password
              </label>
              <input
                type="password"
                className="form-input"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
              <UserPlus size={20} />
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="link-button">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
