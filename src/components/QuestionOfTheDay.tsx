import React, { useState } from 'react';
import { X, BookOpen, Flame, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import type { EnglishQuestion } from '../types';
import '../css/QuestionOfTheDay.css';

interface Props {
  question: EnglishQuestion;
  qotdStreak: number;
  onAnswer: (correct: boolean) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<EnglishQuestion['category'], string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  synonym: 'Synonym',
  antonym: 'Antonym',
  idiom: 'Idiom',
  spelling: 'Spelling',
};

const QuestionOfTheDay: React.FC<Props> = ({ question, qotdStreak, onAnswer, onClose }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    onAnswer(idx === question.correctIndex);
  };

  const isCorrect = selected !== null && selected === question.correctIndex;

  return (
    <div className="qotd-overlay">
      <div className="qotd-modal">
        {/* Header band */}
        <div className="qotd-header">
          <div className="qotd-header-icon">
            <BookOpen size={18} />
          </div>
          <div className="qotd-title-row">
            <span>Question of the Day</span>
            <span>Daily English Challenge</span>
          </div>
          {qotdStreak > 0 && (
            <div className="qotd-streak-badge">
              <Flame size={13} />
              <span>{qotdStreak} day streak</span>
            </div>
          )}
          <button className="qotd-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="qotd-body">
          {/* Category tag */}
          <span className="qotd-category-tag">{CATEGORY_LABELS[question.category]}</span>

          {/* Question text */}
          <p className="qotd-question">{question.question}</p>

          {/* Options */}
          <div className="qotd-options">
            {question.options.map((opt, i) => {
              let cls = 'qotd-option';
              if (answered) {
                if (i === question.correctIndex) cls += ' qotd-option-correct';
                else if (i === selected) cls += ' qotd-option-wrong';
                else cls += ' qotd-option-dim';
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleSelect(i)}
                  disabled={answered}
                >
                  <span className="qotd-option-letter">{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback after answering */}
          {answered && (
            <div className={`qotd-feedback ${isCorrect ? 'qotd-feedback-correct' : 'qotd-feedback-wrong'}`}>
              <div className="qotd-feedback-icon">
                {isCorrect ? <CheckCircle size={22} /> : <XCircle size={22} />}
              </div>
              <div>
                <strong>{isCorrect ? 'Correct! +1 streak' : 'Not quite!'}</strong>
                <p>{question.explanation}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {answered ? (
            <button className="qotd-continue-btn" onClick={onClose}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button className="qotd-skip-btn" onClick={onClose}>
              Skip for today
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionOfTheDay;
