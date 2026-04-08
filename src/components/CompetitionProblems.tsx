'use strict';

import React from 'react';
import '../css/CompetitionProblems.css';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import type { CompetitionProblem } from '../types';

interface Props {
  problems: CompetitionProblem[];
  selectedProblem: CompetitionProblem | null;
  onSelectProblem: (problem: CompetitionProblem) => void;
}

const CompetitionProblems: React.FC<Props> = ({
  problems,
  selectedProblem,
  onSelectProblem,
}) => {
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (problems.length === 0) {
    return (
      <div className="cp-empty">
        <Circle size={48} color="#6b7280" />
        <p>No problems available yet.</p>
      </div>
    );
  }

  return (
    <div className="cp-container">
      <div className="cp-header">
        <h3>Problems ({problems.length})</h3>
        <p>Select a problem to start coding</p>
      </div>

      <div className="cp-grid">
        {problems.map((problem) => {
          const isSolved = problem.user_solved === true;
          const isSelected = selectedProblem?.id === problem.id;

          return (
            <div
              key={problem.id}
              className={`cp-card ${isSelected ? 'selected' : ''} ${isSolved ? 'solved' : ''}`}
              onClick={() => onSelectProblem(problem)}
            >
              <div className="cp-card-left">
                <div className="cp-status">
                  {isSolved ? (
                    <CheckCircle size={20} color="#10b981" />
                  ) : (
                    <Circle size={20} color="#6b7280" />
                  )}
                </div>
                <div className="cp-info">
                  <h4 className="cp-title">{problem.title}</h4>
                  <p className="cp-desc">{problem.description.substring(0, 60)}...</p>
                </div>
              </div>

              <div className="cp-card-right">
                <span
                  className="cp-difficulty"
                  style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                >
                  {problem.difficulty}
                </span>
                <span className="cp-points">{problem.points} pts</span>
                <ChevronRight size={20} color="#6b7280" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompetitionProblems;
