import React, { useState } from 'react';
import type { StudentProfile } from '../types';

const careerPaths: { [key: string]: string[] } = {
  'Computer Science': ['Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Mobile Developer'],
  'Information Technology': ['Full Stack Developer', 'Cybersecurity Analyst', 'Cloud Engineer', 'Mobile Developer'],
  'Electronics & Communication': ['IoT Developer', 'Embedded Systems Engineer', 'RF Engineer', 'Network Engineer'],
  'Mechanical': ['CAD Designer', 'Robotics Engineer', 'Product Designer', 'Manufacturing Engineer'],
  'Electrical': ['Power Systems Engineer', 'Control Systems Engineer', 'Electrical Design Engineer'],
  'Civil': ['Structural Engineer', 'Civil CAD Specialist', 'Project Manager'],
};
import { User, GraduationCap, Target, Plus, X, Sparkles } from 'lucide-react';
import '../css/ProfileCreation.css';

interface Props {
  onComplete: (profile: StudentProfile) => Promise<void>;
}

const ProfileCreation: React.FC<Props> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    year: 1,
    interests: [] as string[],
    careerPath: '',
  });

  const [currentInterest, setCurrentInterest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const branches = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical',
    'Electrical',
    'Civil',
  ];

  const handleAddInterest = () => {
    if (currentInterest.trim() && !formData.interests.includes(currentInterest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, currentInterest.trim()],
      });
      setCurrentInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest),
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const profile: StudentProfile = {
      id: '',
      name: formData.name,
      branch: formData.branch,
      year: formData.year,
      interests: formData.interests,
      careerPath: formData.careerPath,
    };

    try {
      await onComplete(profile);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setError(message);
      setIsLoading(false);
    }
  };

  const availableCareerPaths = formData.branch ? careerPaths[formData.branch] || [] : [];

  return (
    <div className="profile-creation-container">
      <div className="profile-creation-wrapper">
        <div className="profile-header">
          <div className="profile-icon-wrapper">
            <div className="profile-icon">
              <Sparkles size={28} />
            </div>
          </div>
          <h1 className="profile-main-title">Create Your Profile</h1>
          <p className="profile-main-subtitle">
            Tell us about yourself to get personalized learning recommendations
          </p>
        </div>

        <div className="profile-card">
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-form-group">
              <label className="profile-form-label">
                <User size={18} />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                className="profile-form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group profile-form-half">
                <label className="profile-form-label">
                  <GraduationCap size={18} />
                  <span>Branch</span>
                </label>
                <select
                  className="profile-form-select"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value, careerPath: '' })}
                  required
                  aria-label="Select your branch"
                >
                  <option value="">Select branch</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div className="profile-form-group profile-form-half">
                <label className="profile-form-label">
                  <span>Year of Study</span>
                </label>
                <select
                  className="profile-form-select"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                  aria-label="Select year of study"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">
                <span>Your Interests</span>
                <span className="profile-label-hint">(Add at least one)</span>
              </label>
              <div className="profile-interest-input-row">
                <input
                  type="text"
                  className="profile-form-input"
                  value={currentInterest}
                  onChange={(e) => setCurrentInterest(e.target.value)}
                  placeholder="e.g., Web Development, AI, Cloud Computing"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInterest();
                    }
                  }}
                />
                <button
                  type="button"
                  className="profile-add-btn"
                  onClick={handleAddInterest}
                  disabled={!currentInterest.trim()}
                >
                  <Plus size={20} />
                  Add
                </button>
              </div>

              {formData.interests.length > 0 && (
                <div className="profile-interests-list">
                  {formData.interests.map(interest => (
                    <span key={interest} className="profile-interest-tag">
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="profile-interest-remove"
                        aria-label="Remove interest"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {availableCareerPaths.length > 0 && (
              <div className="profile-form-group">
                <label className="profile-form-label">
                  <Target size={18} />
                  <span>Desired Career Path</span>
                </label>
                <select
                  className="profile-form-select"
                  value={formData.careerPath}
                  onChange={(e) => setFormData({ ...formData, careerPath: e.target.value })}
                  required
                  aria-label="Select career path"
                >
                  <option value="">Select your career path</option>
                  {availableCareerPaths.map(path => (
                    <option key={path} value={path}>{path}</option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <p className="profile-error-message">{error}</p>
            )}
            <button
              type="submit"
              className="profile-submit-btn"
              disabled={formData.interests.length === 0 || isLoading}
            >
              <span>{isLoading ? 'Saving...' : 'Continue to Dashboard'}</span>
              {!isLoading && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>
          </form>
        </div>

        <div className="profile-footer-hint">
          <p>💡 Your profile helps us recommend the best learning path for you</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCreation;