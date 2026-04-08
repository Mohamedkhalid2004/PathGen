import React, { useState } from 'react';
import { User, Save, Plus, X, Loader, Lock, Compass } from 'lucide-react';
import type { StudentProfile } from '../types';
import { updateProfile } from '../lib/api';
import '../css/ProfileEditor.css';

interface Props {
  profile: StudentProfile;
  onProfileUpdate: (updated: StudentProfile) => void;
  onExploreCareerPath: (careerPath: string, branch: string) => void;
  onClearExploreData: () => void;
  exploreData: { careerPath: string; branch: string } | null;
}

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical',
  'Electrical',
  'Civil',
];

const CAREER_PATHS: Record<string, string[]> = {
  'Computer Science': ['Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Mobile Developer'],
  'Information Technology': ['Full Stack Developer', 'Cybersecurity Analyst', 'Cloud Engineer', 'Mobile Developer'],
  'Electronics & Communication': ['IoT Developer', 'Embedded Systems Engineer', 'RF Engineer', 'Network Engineer'],
  'Mechanical': ['CAD Designer', 'Robotics Engineer', 'Product Designer', 'Manufacturing Engineer'],
  'Electrical': ['Power Systems Engineer', 'Control Systems Engineer', 'Electrical Design Engineer'],
  'Civil': ['Structural Engineer', 'Civil CAD Specialist', 'Project Manager'],
};

const ProfileEditor: React.FC<Props> = ({ profile, onProfileUpdate, onExploreCareerPath, onClearExploreData, exploreData }) => {
  const [name, setName] = useState(profile.name);
  const [year, setYear] = useState(profile.year);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [interestInput, setInterestInput] = useState('');
  const [exploringBranches, setExploringBranches] = useState<string[]>(profile.exploringBranches ?? []);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  // initialise selector from current exploreData so it survives tab navigation
  const [exploreCareerPath, setExploreCareerPath] = useState(exploreData?.careerPath ?? '');

  // The single currently-selected exploring branch (at most one)
  const selectedBranch = exploringBranches[0] ?? '';

  const addInterest = () => {
    const val = interestInput.trim();
    if (val && !interests.includes(val)) {
      setInterests(prev => [...prev, val]);
    }
    setInterestInput('');
  };

  const removeInterest = (tag: string) => {
    setInterests(prev => prev.filter(i => i !== tag));
  };

  const handleBranchChange = (newBranch: string) => {
    const old = exploringBranches[0] ?? '';
    setExploringBranches(newBranch ? [newBranch] : []);
    setExploreCareerPath('');
    if (old && old !== newBranch && exploreData?.branch === old) {
      onClearExploreData();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        year,
        interests,
        exploringBranches,
      });
      onProfileUpdate(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const otherBranches = BRANCHES.filter(b => b !== profile.branch);

  return (
    <div className="card profile-editor-card">
      <div className="card-header">
        <User size={32} color="#667eea" />
        <div>
          <h2 className="card-title">Edit Profile</h2>
          <p className="card-description">Update your personal details, year, and career direction</p>
        </div>
      </div>

      {error && <div className="pe-error">{error}</div>}
      {success && <div className="pe-success">Profile updated successfully!</div>}

      <form className="pe-form" onSubmit={handleSave}>
        <div className="pe-field">
          <label className="pe-label">Full Name *</label>
          <input
            className="pe-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="pe-row">
          <div className="pe-field">
            <label className="pe-label">Year of Study *</label>
            <select className="pe-input" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[1, 2, 3, 4].map(y => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>

          <div className="pe-field">
            <label className="pe-label">
              Branch
              <span className="pe-locked-badge"><Lock size={11} /> Locked</span>
            </label>
            <select className="pe-input pe-input-locked" value={profile.branch} disabled>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <p className="pe-lock-hint">Your branch is locked — stay committed to your path.</p>
          </div>
        </div>

        <div className="pe-field">
          <label className="pe-label">
            Career Path
            <span className="pe-locked-badge"><Lock size={11} /> Locked</span>
          </label>
          <select className="pe-input pe-input-locked" value={profile.careerPath ?? ''} disabled>
            <option value="">— No career path set —</option>
            {(CAREER_PATHS[profile.branch] ?? []).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <p className="pe-lock-hint">Your career path is locked — focus builds mastery.</p>
        </div>

        <div className="pe-field">
          <label className="pe-label">Explore Another Department</label>
          <p className="pe-field-desc">
            Select one department to explore. Changing it won't affect your main career roadmap.
          </p>
          <select
            className="pe-input"
            value={selectedBranch}
            onChange={e => handleBranchChange(e.target.value)}
          >
            <option value="">— None —</option>
            {otherBranches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {selectedBranch && (
          <div className="pe-field">
            <label className="pe-label">Career Path to Explore in {selectedBranch}</label>
            <div className="pe-explore-selectors">
              <select
                className="pe-input"
                value={exploreCareerPath}
                onChange={e => setExploreCareerPath(e.target.value)}
              >
                <option value="">— Select a career path —</option>
                {(CAREER_PATHS[selectedBranch] ?? []).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              {exploreCareerPath && (
                <button
                  type="button"
                  className="btn btn-primary pe-explore-btn"
                  onClick={() => onExploreCareerPath(exploreCareerPath, selectedBranch)}
                >
                  <Compass size={16} /> View Courses &amp; Resources
                </button>
              )}
            </div>
          </div>
        )}

        <div className="pe-field">
          <label className="pe-label">Interests</label>
          <div className="pe-tags">
            {interests.map(tag => (
              <span key={tag} className="pe-tag">
                {tag}
                <button type="button" className="pe-tag-remove" onClick={() => removeInterest(tag)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="pe-tag-input-row">
            <input
              className="pe-input pe-tag-input"
              type="text"
              placeholder="Add an interest…"
              value={interestInput}
              onChange={e => setInterestInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }}
            />
            <button type="button" className="btn btn-secondary pe-tag-add-btn" onClick={addInterest}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        <button className="btn btn-primary pe-save-btn" type="submit" disabled={saving}>
          {saving ? <><Loader size={16} className="pe-spinner" /> Saving…</> : <><Save size={16} /> Save Changes</>}
        </button>
      </form>
    </div>
  );
};

export default ProfileEditor;
