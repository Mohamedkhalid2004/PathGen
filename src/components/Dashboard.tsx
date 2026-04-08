import React, { useState, useEffect } from 'react';
import type { StudentProfile, Skill, Certification, EnglishQuestion } from '../types';
import CareerRoadmap from './CareerRoadmap';
import WhereToStart from './WhereToStart';
import WeeklyPlan from './WeeklyPlan';
import LearningResources from './LearningResources';
import ProgressTracker from './ProgressTracker';
import ProjectSuggestions from './ProjectSuggestions';
import InternshipRecommendations from './InternshipRecommendations';
import ReadinessChecker from './ReadinessChecker';
import { Home, BookOpen, Calendar, PlayCircle, TrendingUp, Briefcase, CheckCircle, Code, LogOut, Compass, FileText, MessageSquare, Award, Settings, Flame, Target, Trophy } from 'lucide-react';
import AIChatbot from './AIChatbot';
import ResumeBuilder from './ResumeBuilder';
import MockInterview from './MockInterview';
import CertificationTracker from './CertificationTracker';
import ProfileEditor from './ProfileEditor';
import StreakTracker from './StreakTracker';
import ExploreCareerView from './ExploreCareerView';
import QuestionOfTheDay from './QuestionOfTheDay';
import JobTracker from './JobTracker';
import CompetitionDashboard from './CompetitionDashboard';
import { getCertifications, hasAnsweredQOTDToday, getQOTDStreak, logActivity, getTodaysEnglishQuestion } from '../lib/api';

interface Props {
  profile: StudentProfile;
  skills: Skill[];
  completedProjects: string[];
  onSkillComplete: (skillId: string) => void;
  onProjectComplete: (projectId: string) => void;
  onProfileUpdate: (updated: StudentProfile) => void;
  onLogout: () => void;
}

type TabType = 'overview' | 'roadmap' | 'start' | 'weekly' | 'resources' | 'progress' | 'projects' | 'internships' | 'jobs' | 'readiness' | 'resume' | 'interview' | 'certifications' | 'profile' | 'streak' | 'explore' | 'competition';

const Dashboard: React.FC<Props> = ({ profile, skills, completedProjects, onSkillComplete, onProjectComplete, onProfileUpdate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [exploreData, setExploreData] = useState<{ careerPath: string; branch: string } | null>(null);
  const [showQOTD, setShowQOTD] = useState(false);
  const [qotdStreak, setQotdStreak] = useState(0);
  const [todaysQuestion, setTodaysQuestion] = useState<EnglishQuestion | null>(null);

  useEffect(() => {
    getCertifications()
      .then(setCertifications)
      .catch(() => {});

    Promise.all([hasAnsweredQOTDToday(), getQOTDStreak(), getTodaysEnglishQuestion()])
      .then(([answered, streak, question]) => {
        setQotdStreak(streak);
        setTodaysQuestion(question);
        if (!answered && question) setShowQOTD(true);
      })
      .catch(() => {});
  }, []);

  const handleExploreCareerPath = (careerPath: string, branch: string) => {
    setExploreData({ careerPath, branch });
    setActiveTab('explore');
  };

  const handleClearExploreData = () => {
    setExploreData(null);
    if (activeTab === 'explore') setActiveTab('overview');
  };

  const handleQOTDAnswer = async (_correct: boolean) => {
    await logActivity('qotd_answered');
    setQotdStreak(prev => prev + 1);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Home },
    { id: 'roadmap' as TabType, label: 'Career Roadmap', icon: BookOpen },
    { id: 'start' as TabType, label: 'Where to Start', icon: PlayCircle },
    { id: 'weekly' as TabType, label: 'Weekly Plan', icon: Calendar },
    { id: 'resources' as TabType, label: 'Resources', icon: Code },
    { id: 'progress' as TabType, label: 'Progress', icon: TrendingUp },
    { id: 'projects' as TabType, label: 'Projects', icon: Code },
    { id: 'internships' as TabType, label: 'Internships', icon: Briefcase },
    { id: 'jobs' as TabType, label: 'Job Tracker', icon: Target },
    { id: 'competition' as TabType, label: 'Competition', icon: Trophy },
    { id: 'readiness' as TabType, label: 'Readiness', icon: CheckCircle },
    { id: 'resume' as TabType, label: 'Resume', icon: FileText },
    { id: 'interview' as TabType, label: 'Mock Interview', icon: MessageSquare },
    { id: 'certifications' as TabType, label: 'Certifications', icon: Award },
    { id: 'streak' as TabType, label: 'Streak', icon: Flame },
    { id: 'profile' as TabType, label: 'Edit Profile', icon: Settings },
    ...(exploreData ? [{ id: 'explore' as TabType, label: `Explore: ${exploreData.careerPath}`, icon: Compass }] : []),
  ];

  const completedSkillsCount = skills.filter(s => s.completed).length;
  const progressPercentage = skills.length > 0 ? Math.round((completedSkillsCount / skills.length) * 100) : 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <Compass size={32} className="logo-icon" />
          <h1>PathFinder+</h1>
        </div>

        <div className="dashboard-user">
          <div className="user-info">
            <div className="user-name">{profile.name}</div>
            <div className="user-role">{profile.careerPath} • Year {profile.year}</div>
          </div>
          <button onClick={onLogout} className="btn-logout">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{completedSkillsCount}/{skills.length}</div>
            <div className="stat-label">Skills Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{progressPercentage}%</div>
            <div className="stat-label">Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completedProjects.length}</div>
            <div className="stat-label">Projects Done</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{certifications.length}</div>
            <div className="stat-label">Certifications</div>
          </div>
        </div>

        <div className="nav-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'btn btn-primary' : 'btn btn-secondary'}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div>
          {activeTab === 'overview' && (
            <div className="grid-2">
              <WhereToStart skills={skills} />
              <ProgressTracker
                skills={skills}
                completedProjects={completedProjects}
              />
            </div>
          )}

          {activeTab === 'roadmap' && (
            <CareerRoadmap
              skills={skills}
              careerPath={profile.careerPath || ''}
              onSkillComplete={onSkillComplete}
            />
          )}

          {activeTab === 'start' && <WhereToStart skills={skills} />}

          {activeTab === 'weekly' && <WeeklyPlan skills={skills} />}

          {activeTab === 'resources' && <LearningResources skills={skills} />}

          {activeTab === 'progress' && (
            <ProgressTracker
              skills={skills}
              completedProjects={completedProjects}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectSuggestions
              skills={skills}
              completedProjects={completedProjects}
              onProjectComplete={onProjectComplete}
              careerPath={profile.careerPath || ''}
            />
          )}

          {activeTab === 'internships' && (
            <InternshipRecommendations skills={skills} careerPath={profile.careerPath || ''} />
          )}

          {activeTab === 'jobs' && (
            <JobTracker
              skills={skills}
              careerPath={profile.careerPath || ''}
            />
          )}

          {activeTab === 'competition' && (
            <CompetitionDashboard
              profile={profile}
            />
          )}

          {activeTab === 'readiness' && (
            <ReadinessChecker
              skills={skills}
              completedProjects={completedProjects}
            />
          )}

          {activeTab === 'resume' && (
            <ResumeBuilder
              profile={profile}
              skills={skills}
              completedProjects={completedProjects}
              certifications={certifications}
            />
          )}

          {activeTab === 'interview' && (
            <MockInterview
              profile={profile}
              skills={skills}
            />
          )}

          {activeTab === 'certifications' && (
            <CertificationTracker
              onCertificationsChange={setCertifications}
            />
          )}

          {activeTab === 'streak' && <StreakTracker />}

          {activeTab === 'profile' && (
            <ProfileEditor
              profile={profile}
              onProfileUpdate={onProfileUpdate}
              onExploreCareerPath={handleExploreCareerPath}
              onClearExploreData={handleClearExploreData}
              exploreData={exploreData}
            />
          )}

          {activeTab === 'explore' && exploreData && (
            <ExploreCareerView
              careerPath={exploreData.careerPath}
              branch={exploreData.branch}
            />
          )}

        </div>
      </div>

      {showQOTD && todaysQuestion && (
        <QuestionOfTheDay
          question={todaysQuestion}
          qotdStreak={qotdStreak}
          onAnswer={handleQOTDAnswer}
          onClose={() => setShowQOTD(false)}
        />
      )}

      <AIChatbot profile={profile} skills={skills} />
    </div>
  );
};

export default Dashboard;
