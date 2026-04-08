'use strict';

import React, { useState, useEffect } from 'react';
import '../css/CompetitionDashboard.css';
import { Trophy, BookOpen, Code, TrendingUp, Clock, Zap, Play } from 'lucide-react';
import type { StudentProfile, Competition, CompetitionProblem, CompetitionScore } from '../types';
import { getCurrentCompetition, getCompetitionProblems, getUserCompetitionScore } from '../lib/api';
import CompetitionProblems from './CompetitionProblems';
import CompetitionArena from './CompetitionArena';
import CompetitionLeaderboard from './CompetitionLeaderboard';

interface Props {
  profile: StudentProfile;
}

type TabType = 'problems' | 'arena' | 'leaderboard';

const CompetitionDashboard: React.FC<Props> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('problems');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [problems, setProblems] = useState<CompetitionProblem[]>([]);
  const [userScore, setUserScore] = useState<CompetitionScore | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<CompetitionProblem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const comp = await getCurrentCompetition();
        if (comp) {
          setCompetition(comp);
          const probs = await getCompetitionProblems(comp.id);
          setProblems(probs);
          const score = await getUserCompetitionScore(comp.id);
          setUserScore(score);
        }
      } catch (err) {
        console.error('Failed to load competition:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!competition) return;

    const updateTimer = (): void => {
      const end = new Date(competition.end_time);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Competition Ended');
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${mins}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${mins}m ${secs}s`);
      } else {
        setTimeRemaining(`${mins}m ${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [competition]);

  const handleSelectProblem = (problem: CompetitionProblem): void => {
    setSelectedProblem(problem);
    setActiveTab('arena');
  };

  const handleStartWeeklyChallenge = (): void => {
    if (problems.length === 0) return;
    // Pick random problem
    const randomIndex = Math.floor(Math.random() * problems.length);
    setSelectedProblem(problems[randomIndex]);
    setActiveTab('arena');
  };

  const handleSubmitSuccess = async (passed: boolean): Promise<void> => {
    if (passed) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    // Refresh score
    if (competition) {
      const score = await getUserCompetitionScore(competition.id);
      setUserScore(score);
      const updatedProblems = await getCompetitionProblems(competition.id);
      setProblems(updatedProblems);
    }
  };

  if (loading) {
    return (
      <div className="cd-container">
        <div className="cd-loading">
          <div className="cd-spinner"></div>
          <p>Loading competition...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="cd-container">
        <div className="cd-empty">
          <Trophy size={64} color="#6b7280" />
          <h2>No Active Competition</h2>
          <p>Check back later for the next weekly challenge!</p>
        </div>
      </div>
    );
  }

  const isArenaLocked = !selectedProblem;

  return (
    <div className="cd-container">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="cd-celebration">
          <div className="cd-celebration-content">
            <div className="cd-confetti"></div>
            <Trophy size={80} color="#fbbf24" />
            <h1>PASSED!</h1>
            <p>Great job! Your solution is correct.</p>
          </div>
        </div>
      )}

      {/* Weekly Competition Banner */}
      <div className="cd-weekly-banner">
        <div className="cd-banner-left">
          <Zap size={28} color="#fbbf24" />
          <div className="cd-banner-info">
            <h2>{competition.title}</h2>
            <p>{competition.description}</p>
          </div>
        </div>
        <div className="cd-banner-right">
          <div className="cd-timer">
            <Clock size={20} />
            <span className={timeRemaining.includes('Ended') ? 'ended' : ''}>
              {timeRemaining}
            </span>
          </div>
          <button className="cd-challenge-btn" onClick={handleStartWeeklyChallenge}>
            <Play size={18} />
            Start Random Challenge
          </button>
        </div>
      </div>

      {/* User Score Summary */}
      {userScore && (
        <div className="cd-score-bar">
          <div className="cd-score-item">
            <span className="cd-score-label">Rank</span>
            <span className="cd-score-value">#{userScore.rank || '—'}</span>
          </div>
          <div className="cd-score-item">
            <span className="cd-score-label">Score</span>
            <span className="cd-score-value">{userScore.total_score}</span>
          </div>
          <div className="cd-score-item">
            <span className="cd-score-label">Solved</span>
            <span className="cd-score-value">{userScore.problems_solved}/{problems.length}</span>
          </div>
        </div>
      )}

      {/* 3 Tabs */}
      <div className="cd-tabs">
        <button
          className={`cd-tab ${activeTab === 'problems' ? 'active' : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          <BookOpen size={18} />
          All Problems
        </button>
        <button
          className={`cd-tab ${activeTab === 'arena' ? 'active' : ''} ${isArenaLocked ? 'locked' : ''}`}
          onClick={() => !isArenaLocked && setActiveTab('arena')}
          disabled={isArenaLocked}
        >
          <Code size={18} />
          Code Arena
          {isArenaLocked && <span className="cd-lock-badge">Select Problem First</span>}
        </button>
        <button
          className={`cd-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <TrendingUp size={18} />
          Leaderboard
        </button>
      </div>

      {/* Tab Content */}
      <div className="cd-content">
        {activeTab === 'problems' && (
          <CompetitionProblems
            problems={problems}
            selectedProblem={selectedProblem}
            onSelectProblem={handleSelectProblem}
          />
        )}

        {activeTab === 'arena' && selectedProblem && (
          <CompetitionArena
            problem={selectedProblem}
            competition={competition}
            isWeeklyChallenge={false}
            onSubmitSuccess={handleSubmitSuccess}
            onBack={() => setActiveTab('problems')}
          />
        )}

        {activeTab === 'leaderboard' && (
          <CompetitionLeaderboard
            competitionId={competition.id}
            userId={profile.id}
          />
        )}
      </div>
    </div>
  );
};

export default CompetitionDashboard;
