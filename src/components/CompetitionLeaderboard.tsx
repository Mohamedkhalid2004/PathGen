'use strict';

import React, { useState, useEffect } from 'react';
import '../css/CompetitionLeaderboard.css';
import { Trophy, RefreshCw, Medal } from 'lucide-react';
import { getCompetitionLeaderboard } from '../lib/api';
import type { CompetitionLeaderboardEntry } from '../types';

interface Props {
  competitionId: string;
  userId: string;
}

const CompetitionLeaderboard: React.FC<Props> = ({ competitionId, userId }) => {
  const [leaderboard, setLeaderboard] = useState<CompetitionLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadLeaderboard = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getCompetitionLeaderboard(competitionId, 100);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    // Poll every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [competitionId]);

  const getRankDisplay = (rank: number): React.ReactNode => {
    if (rank === 1) return <Medal size={20} color="#fbbf24" />;
    if (rank === 2) return <Medal size={20} color="#9ca3af" />;
    if (rank === 3) return <Medal size={20} color="#b45309" />;
    return `#${rank}`;
  };

  if (loading && leaderboard.length === 0) {
    return (
      <div className="cl-loading">
        <div className="cl-spinner"></div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="cl-empty">
        <Trophy size={48} color="#6b7280" />
        <p>No participants yet. Be the first to solve a problem!</p>
      </div>
    );
  }

  return (
    <div className="cl-container">
      <div className="cl-header">
        <h3>
          <Trophy size={20} />
          Leaderboard
        </h3>
        <button
          type="button"
          className="cl-refresh"
          onClick={loadLeaderboard}
          disabled={loading}
          aria-label="Refresh leaderboard"
        >
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      <div className="cl-table">
        <div className="cl-table-header">
          <div className="cl-col-rank">Rank</div>
          <div className="cl-col-name">Name</div>
          <div className="cl-col-branch">Branch</div>
          <div className="cl-col-score">Score</div>
          <div className="cl-col-solved">Solved</div>
        </div>

        <div className="cl-table-body">
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.user_id === userId;

            return (
              <div
                key={entry.user_id}
                className={`cl-row ${isCurrentUser ? 'current-user' : ''} ${entry.rank <= 3 ? 'top-three' : ''}`}
              >
                <div className="cl-col-rank">{getRankDisplay(entry.rank)}</div>
                <div className="cl-col-name">
                  {entry.name}
                  {isCurrentUser && <span className="cl-you-badge">You</span>}
                </div>
                <div className="cl-col-branch">{entry.branch}</div>
                <div className="cl-col-score">{entry.total_score}</div>
                <div className="cl-col-solved">{entry.problems_solved}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompetitionLeaderboard;
