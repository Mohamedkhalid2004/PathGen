'use strict';

import React, { useState, useEffect, useRef } from 'react';
import '../css/CompetitionArena.css';
import { Play, ArrowLeft, Check, X, AlertTriangle } from 'lucide-react';
import { EditorView, minimalSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { javascript } from '@codemirror/lang-javascript';
import { submitCompetitionCode } from '../lib/api';
import type { CompetitionProblem, Competition } from '../types';

// Light theme for CodeMirror
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  '.cm-content': {
    caretColor: '#6366f1',
  },
  '.cm-cursor': {
    borderLeftColor: '#6366f1',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: '#dbeafe',
  },
  '.cm-gutters': {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
    borderRight: '1px solid #e5e7eb',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f3f4f6',
  },
  '.cm-activeLine': {
    backgroundColor: '#f8fafc',
  },
}, { dark: false });

interface Props {
  problem: CompetitionProblem;
  competition: Competition;
  isWeeklyChallenge: boolean;
  onSubmitSuccess: (passed: boolean) => void;
  onBack: () => void;
}

type Language = 'python' | 'java' | 'cpp' | 'javascript';
type ResultStatus = 'passed' | 'failed' | 'syntax_error' | null;

const LANGUAGE_TEMPLATES: Record<Language, string> = {
  python: `# Write your solution here
def solve():
    # Your code here
    pass

solve()
`,
  java: `public class Solution {
    public static void main(String[] args) {
        // Your solution here
    }
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Your solution here
    return 0;
}
`,
  javascript: `// Write your solution here
function solve() {
    // Your code here
}

solve();
`,
};

const CompetitionArena: React.FC<Props> = ({
  problem,
  competition,
  isWeeklyChallenge,
  onSubmitSuccess,
  onBack,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const [language, setLanguage] = useState<Language>('python');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ResultStatus>(null);
  const [feedback, setFeedback] = useState<string>('');

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorRef.current) return;

    const getLanguageExtension = (lang: Language) => {
      switch (lang) {
        case 'python': return python();
        case 'java': return java();
        case 'cpp': return cpp();
        case 'javascript': return javascript();
        default: return python();
      }
    };

    editorViewRef.current = new EditorView({
      doc: LANGUAGE_TEMPLATES[language],
      extensions: [minimalSetup, getLanguageExtension(language), lightTheme],
      parent: editorRef.current,
    });

    return () => {
      editorViewRef.current?.destroy();
      editorViewRef.current = null;
    };
  }, [language]);

  const handleLanguageChange = (newLang: Language): void => {
    if (newLang !== language) {
      editorViewRef.current?.destroy();
      editorViewRef.current = null;
      setLanguage(newLang);
      setResult(null);
      setFeedback('');
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!editorViewRef.current) return;

    const code = editorViewRef.current.state.doc.toString().trim();

    // Basic validation
    if (!code || code.length < 10) {
      setResult('syntax_error');
      setFeedback('Code is too short or empty');
      return;
    }

    setLoading(true);
    setResult(null);
    setFeedback('');

    try {
      const response = await submitCompetitionCode(
        competition.id,
        problem.id,
        code,
        language
      );

      if (response.verdict === 'Accepted') {
        setResult('passed');
        setFeedback('Your solution is correct!');
        onSubmitSuccess(true);
      } else if (response.verdict === 'Syntax Error') {
        setResult('syntax_error');
        setFeedback(response.feedback || 'Syntax error in your code');
        onSubmitSuccess(false);
      } else {
        setResult('failed');
        setFeedback(response.feedback || 'Wrong answer - check your logic');
        onSubmitSuccess(false);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setResult('syntax_error');
      setFeedback('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (): React.ReactNode => {
    switch (result) {
      case 'passed':
        return <Check size={24} color="#10b981" />;
      case 'failed':
        return <X size={24} color="#ef4444" />;
      case 'syntax_error':
        return <AlertTriangle size={24} color="#f59e0b" />;
      default:
        return null;
    }
  };

  const getResultClass = (): string => {
    switch (result) {
      case 'passed': return 'ca-result-passed';
      case 'failed': return 'ca-result-failed';
      case 'syntax_error': return 'ca-result-syntax';
      default: return '';
    }
  };

  const getResultTitle = (): string => {
    switch (result) {
      case 'passed': return 'PASSED';
      case 'failed': return 'FAILED';
      case 'syntax_error': return 'SYNTAX ERROR';
      default: return '';
    }
  };

  return (
    <div className="ca-container">
      {/* Header */}
      <div className="ca-header">
        <button type="button" className="ca-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back to Problems
        </button>
        <div className="ca-problem-info">
          <h2>{problem.title}</h2>
          <div className="ca-badges">
            <span className={`ca-difficulty ca-difficulty-${problem.difficulty}`}>
              {problem.difficulty}
            </span>
            <span className="ca-points">{problem.points} pts</span>
            {isWeeklyChallenge && (
              <span className="ca-weekly-badge">Weekly Challenge (2x Points)</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="ca-layout">
        {/* Left: Problem Description */}
        <div className="ca-left">
          <div className="ca-problem-card">
            <h3>Problem Description</h3>
            <p className="ca-description">{problem.description}</p>

            <div className="ca-constraints">
              <h4>Constraints</h4>
              <ul>
                <li>Time Limit: {problem.time_limit}s</li>
                <li>Memory Limit: {problem.memory_limit}MB</li>
              </ul>
            </div>

            {problem.test_cases.length > 0 && (
              <div className="ca-example">
                <h4>Example</h4>
                <div className="ca-example-box">
                  <div className="ca-example-row">
                    <strong>Input:</strong>
                    <code>{problem.test_cases[0].input}</code>
                  </div>
                  <div className="ca-example-row">
                    <strong>Output:</strong>
                    <code>{problem.test_cases[0].expected_output}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Code Editor */}
        <div className="ca-right">
          <div className="ca-editor-header">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="ca-language-select"
              aria-label="Select programming language"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>

          <div className="ca-editor" ref={editorRef} />

          <button
            type="button"
            className="ca-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="ca-spinner"></div>
                Checking...
              </>
            ) : (
              <>
                <Play size={18} />
                Submit Code
              </>
            )}
          </button>

          {/* Result Display */}
          {result && (
            <div className={`ca-result ${getResultClass()}`}>
              <div className="ca-result-header">
                {getResultIcon()}
                <span className="ca-result-title">{getResultTitle()}</span>
              </div>
              <p className="ca-result-feedback">{feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionArena;
