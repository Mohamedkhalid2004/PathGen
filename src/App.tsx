import { useState, useEffect } from 'react';
import './App.css';
import Login from './Pages/Login';
import Register from './Pages/Register';
import ProfileCreation from './components/ProfileCreation';
import Dashboard from './components/Dashboard';
import type { StudentProfile, Skill } from './types';
import {
  getCurrentUser,
  getProfile,
  createProfile,
  getSkills,
  getCompletedProjectIds,
  setSkillCompleted,
  setProjectCompleted,
  logout,
  logActivity,
} from './lib/api';

type AppState = 'login' | 'register' | 'profile' | 'dashboard';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('login');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [completedProjects, setCompletedProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const savedProfile = await getProfile();
          if (savedProfile) {
            setProfile(savedProfile);
            if (savedProfile.careerPath) {
              setSkills(await getSkills(savedProfile.careerPath));
            }
            setCompletedProjects(await getCompletedProjectIds());
            setCurrentState('dashboard');
          } else {
            setCurrentState('profile');
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogin = async () => {
    try {
      const savedProfile = await getProfile();
      if (savedProfile) {
        setProfile(savedProfile);
        if (savedProfile.careerPath) {
          setSkills(await getSkills(savedProfile.careerPath));
        }
        setCompletedProjects(await getCompletedProjectIds());
        setCurrentState('dashboard');
      } else {
        setCurrentState('profile');
      }
    } catch (err) {
      console.error('Login routing error:', err);
    }
  };

  const handleRegister = () => {
    setCurrentState('login');
  };

  const handleProfileComplete = async (newProfile: StudentProfile) => {
    try {
      const saved = await createProfile(newProfile);
      setProfile(saved);
      if (saved.careerPath) {
        setSkills(await getSkills(saved.careerPath));
      }
      setCurrentState('dashboard');
    } catch (err) {
      console.error('Profile save error:', err);
    }
  };

  const handleSkillComplete = async (skillId: string) => {
    await setSkillCompleted(skillId, true);
    logActivity('skill_completed');
    setSkills(prev =>
      prev.map(skill =>
        skill.id === skillId ? { ...skill, completed: true } : skill
      )
    );
  };

  const handleProjectComplete = async (projectId: string) => {
    await setProjectCompleted(projectId, true);
    logActivity('project_completed');
    setCompletedProjects(prev => [...prev, projectId]);
  };

  const handleProfileUpdate = async (updated: StudentProfile) => {
    setProfile(updated);
    if (updated.careerPath && updated.careerPath !== profile?.careerPath) {
      setSkills(await getSkills(updated.careerPath));
    }
  };

  const handleLogout = async () => {
    await logout();
    setProfile(null);
    setSkills([]);
    setCompletedProjects([]);
    setCurrentState('login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#6366f1' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="App">
      {currentState === 'login' && (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentState('register')}
        />
      )}

      {currentState === 'register' && (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentState('login')}
        />
      )}

      {currentState === 'profile' && (
        <ProfileCreation onComplete={handleProfileComplete} />
      )}

      {currentState === 'dashboard' && (
        <Dashboard
          profile={profile!}
          skills={skills}
          completedProjects={completedProjects}
          onSkillComplete={handleSkillComplete}
          onProjectComplete={handleProjectComplete}
          onProfileUpdate={handleProfileUpdate}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;

