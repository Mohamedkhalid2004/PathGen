'use strict';

import React, { useEffect, useMemo, useState } from 'react';
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
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.max(1, Math.ceil(problems.length / PAGE_SIZE));

  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return problems.slice(start, end);
  }, [problems, currentPage]);

  useEffect(() => {
    setCurrentPage((prevPage) => Math.min(prevPage, totalPages));
  }, [totalPages]);

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
        <p>
          Select a problem to start coding
          {problems.length > 0 && ` • Page ${currentPage} of ${totalPages}`}
        </p>
      </div>

      <div className="cp-grid">
        {paginatedProblems.map((problem) => {
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

      {totalPages > 1 && (
        <div className="cp-pagination" aria-label="Problems pagination">
          <button
            type="button"
            className="cp-page-btn"
            onClick={() => setCurrentPage((prevPage) => Math.max(1, prevPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <span className="cp-page-indicator">{currentPage} / {totalPages}</span>

          <button
            type="button"
            className="cp-page-btn"
            onClick={() => setCurrentPage((prevPage) => Math.min(totalPages, prevPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CompetitionProblems;
