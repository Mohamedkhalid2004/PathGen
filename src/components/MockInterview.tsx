import React, { useState, useEffect } from 'react';
import { MessageSquare, Play, ChevronRight, RotateCcw, CheckCircle, AlertCircle, Loader, History, Trophy, Target, Code, Brain, ArrowRight } from 'lucide-react';
import type { StudentProfile, Skill, InterviewSession, AptitudeQuestion, TechnicalQuestion, InterviewRound } from '../types';
import { saveInterviewSession, getInterviewSessions, logActivity, getAptitudeQuestions, getTechnicalQuestions } from '../lib/api';
import '../css/MockInterview.css';

interface Props {
  profile: StudentProfile;
  skills: Skill[];
}

interface QA {
  question: string;
  answer: string;
  feedback: string;
}

type MainStage = 'idle' | 'stage_select' | 'aptitude' | 'technical' | 'ai_interview' | 'final_results';
type SubStage = 'idle' | 'generating' | 'in_progress' | 'reviewing' | 'completed';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MockInterview: React.FC<Props> = ({ profile, skills }) => {
  const [mainStage, setMainStage] = useState<MainStage>('idle');
  const [subStage, setSubStage] = useState<SubStage>('idle');

  // Aptitude state
  const [aptitudeQuestions, setAptitudeQuestions] = useState<AptitudeQuestion[]>([]);
  const [aptitudeIndex, setAptitudeIndex] = useState(0);
  const [aptitudeAnswers, setAptitudeAnswers] = useState<number[]>([]);
  const [selectedAptitude, setSelectedAptitude] = useState<number | null>(null);
  const [aptitudeScore, setAptitudeScore] = useState(0);

  // Technical state
  const [technicalQuestions, setTechnicalQuestions] = useState<TechnicalQuestion[]>([]);
  const [technicalIndex, setTechnicalIndex] = useState(0);
  const [technicalAnswers, setTechnicalAnswers] = useState<number[]>([]);
  const [selectedTechnical, setSelectedTechnical] = useState<number | null>(null);
  const [technicalScore, setTechnicalScore] = useState(0);

  // AI Interview state
  const [aiQuestions, setAIQuestions] = useState<string[]>([]);
  const [aiIndex, setAIIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [qaLog, setQaLog] = useState<QA[]>([]);
  const [summary, setSummary] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [aiScore, setAIScore] = useState(0);

  // Common state
  const [error, setError] = useState('');
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [completedRounds, setCompletedRounds] = useState<InterviewRound[]>([]);

  // AI Validation state
  const [aiValidation, setAIValidation] = useState<{
    overallAssessment: string;
    strengths: string[];
    improvements: string[];
    readinessLevel: 'Excellent' | 'Good' | 'Fair' | 'Needs Work';
    recommendations: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const completedSkills = skills.filter(s => s.completed).map(s => s.name);

  useEffect(() => {
    getInterviewSessions()
      .then(setPastSessions)
      .catch(() => {});
  }, []);

  const groqCall = async (system: string, user: string): Promise<string> => {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
    return data?.choices?.[0]?.message?.content ?? '';
  };

  // Start interview flow
  const startInterview = () => {
    setError('');
    setMainStage('stage_select');
  };

  const startAptitudeRound = async () => {
    setMainStage('aptitude');
    setSubStage('generating');
    setAptitudeIndex(0);
    setAptitudeAnswers([]);
    setSelectedAptitude(null);
    setError('');

    try {
      const questions = await getAptitudeQuestions(5);
      if (questions.length === 0) {
        throw new Error('No aptitude questions available. Please run the SQL migration first.');
      }
      setAptitudeQuestions(questions);
      setSubStage('in_progress');
    } catch (err) {
      setError(`Failed to load questions: ${err instanceof Error ? err.message : String(err)}`);
      setMainStage('stage_select');
      setSubStage('idle');
    }
  };

  const handleAptitudeSelect = (optionIndex: number) => {
    if (selectedAptitude !== null) return;
    setSelectedAptitude(optionIndex);
  };

  const nextAptitudeQuestion = () => {
    if (selectedAptitude === null) return;

    const newAnswers = [...aptitudeAnswers, selectedAptitude];
    setAptitudeAnswers(newAnswers);
    setSelectedAptitude(null);

    if (aptitudeIndex + 1 >= aptitudeQuestions.length) {
      // Calculate score
      const score = aptitudeQuestions.reduce((acc, q, i) => {
        return acc + (newAnswers[i] === q.correctIndex ? 1 : 0);
      }, 0);
      setAptitudeScore(score);

      // Save round
      const round: InterviewRound = {
        roundType: 'aptitude',
        score,
        totalQuestions: aptitudeQuestions.length,
        questions: aptitudeQuestions.map(q => q.question),
        answers: newAnswers,
        completedAt: new Date().toISOString()
      };
      setCompletedRounds(prev => [...prev, round]);

      setSubStage('completed');
    } else {
      setAptitudeIndex(prev => prev + 1);
    }
  };

  const startTechnicalRound = async () => {
    setMainStage('technical');
    setSubStage('generating');
    setTechnicalIndex(0);
    setTechnicalAnswers([]);
    setSelectedTechnical(null);
    setError('');

    try {
      const department = profile.branch; // Use branch as department
      const careerPath = profile.careerPath || profile.branch;
      const questions = await getTechnicalQuestions(department, careerPath, 5);
      if (questions.length === 0) {
        throw new Error('No technical questions available for your department and career path. Please run the SQL migration first.');
      }
      setTechnicalQuestions(questions);
      setSubStage('in_progress');
    } catch (err) {
      setError(`Failed to load questions: ${err instanceof Error ? err.message : String(err)}`);
      setMainStage('stage_select');
      setSubStage('idle');
    }
  };

  const handleTechnicalSelect = (optionIndex: number) => {
    if (selectedTechnical !== null) return;
    setSelectedTechnical(optionIndex);
  };

  const nextTechnicalQuestion = () => {
    if (selectedTechnical === null) return;

    const newAnswers = [...technicalAnswers, selectedTechnical];
    setTechnicalAnswers(newAnswers);
    setSelectedTechnical(null);

    if (technicalIndex + 1 >= technicalQuestions.length) {
      // Calculate score
      const score = technicalQuestions.reduce((acc, q, i) => {
        return acc + (newAnswers[i] === q.correctIndex ? 1 : 0);
      }, 0);
      setTechnicalScore(score);

      // Save round
      const round: InterviewRound = {
        roundType: 'technical',
        score,
        totalQuestions: technicalQuestions.length,
        questions: technicalQuestions.map(q => q.question),
        answers: newAnswers,
        completedAt: new Date().toISOString()
      };
      setCompletedRounds(prev => [...prev, round]);

      setSubStage('completed');
    } else {
      setTechnicalIndex(prev => prev + 1);
    }
  };

  const startAIInterview = async () => {
    if (!GROQ_API_KEY) {
      setError('AI interview requires a Groq API key. Add VITE_GROQ_API_KEY to your .env file.');
      return;
    }
    setError('');
    setMainStage('ai_interview');
    setSubStage('generating');
    setQaLog([]);
    setAIIndex(0);
    setSummary('');
    setCurrentAnswer('');
    setCurrentFeedback('');

    try {
      const department = profile.branch;
      const careerPath = profile.careerPath || profile.branch;

      const raw = await groqCall(
        `You are a technical interviewer for the role of ${careerPath} in the ${department} department. Generate exactly 5 behavioral and scenario-based interview questions. These should test problem-solving, teamwork, and real-world application of skills specific to ${department} and ${careerPath}. Respond with ONLY a valid JSON array of 5 strings, no markdown, no explanation.`,
        `Department: ${department}\nCareer Path: ${careerPath}\nCandidate's completed skills: ${completedSkills.length > 0 ? completedSkills.join(', ') : 'beginner level, no skills completed yet'}. Make questions conversational, open-ended, and relevant to both the department and career path.`
      );

      const match = raw.match(/\[[\s\S]*\]/);
      const parsed: string[] = JSON.parse(match ? match[0] : raw);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid question format');
      setAIQuestions(parsed.slice(0, 5));
      setSubStage('in_progress');
    } catch (err) {
      setError(`Failed to generate questions: ${err instanceof Error ? err.message : String(err)}`);
      setMainStage('stage_select');
    }
  };

  const submitAIAnswer = async () => {
    if (!currentAnswer.trim() || isLoadingFeedback) return;
    setIsLoadingFeedback(true);
    setCurrentFeedback('');

    try {
      const fb = await groqCall(
        `You are a friendly but thorough interviewer. Evaluate the candidate's answer in exactly 2-3 sentences. Always begin with either "Strong answer:" (if good) or "Could improve:" (if needs work). Be constructive and specific.`,
        `Question: ${aiQuestions[aiIndex]}\nCandidate's answer: ${currentAnswer.trim()}`
      );
      setCurrentFeedback(fb);
      setSubStage('reviewing');
    } catch (err) {
      setCurrentFeedback(`Could not evaluate: ${err instanceof Error ? err.message : String(err)}`);
      setSubStage('reviewing');
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const nextAIQuestion = async () => {
    const newLog: QA[] = [
      ...qaLog,
      { question: aiQuestions[aiIndex], answer: currentAnswer.trim(), feedback: currentFeedback },
    ];
    setQaLog(newLog);
    setCurrentAnswer('');
    setCurrentFeedback('');

    if (aiIndex + 1 >= aiQuestions.length) {
      setSubStage('generating');
      let sum = 'Interview complete! Review your answers and feedback below.';
      try {
        const allText = newLog
          .map((qa, i) => `Q${i + 1}: ${qa.question}\nA: ${qa.answer}\nFeedback: ${qa.feedback}`)
          .join('\n\n');
        sum = await groqCall(
          `You are a technical interviewer. Write a 3-sentence overall performance summary for the AI interview round. Mention their strongest point, an area to improve, and a final encouraging note.`,
          `Interview transcript:\n${allText}`
        );
      } catch { /* keep default summary */ }
      setSummary(sum);

      const score = newLog.filter(qa => qa.feedback.trim().toLowerCase().startsWith('strong')).length;
      setAIScore(score);

      // Save round
      const round: InterviewRound = {
        roundType: 'ai',
        score,
        totalQuestions: newLog.length,
        questions: newLog.map(qa => qa.question),
        answers: newLog.map(qa => qa.answer),
        feedback: newLog.map(qa => qa.feedback),
        completedAt: new Date().toISOString()
      };
      setCompletedRounds(prev => [...prev, round]);

      setSubStage('completed');
    } else {
      setAIIndex(prev => prev + 1);
      setSubStage('in_progress');
    }
  };

  const generateAIValidation = async (totalScore: number, totalQuestions: number) => {
    if (!GROQ_API_KEY) {
      return null;
    }

    setIsValidating(true);
    try {
      const percentage = (totalScore / totalQuestions) * 100;

      // Build detailed performance summary
      const performanceSummary = `
Department: ${profile.branch}
Career Path: ${profile.careerPath || profile.branch}
Total Score: ${totalScore}/${totalQuestions} (${percentage.toFixed(1)}%)

Round 1 - Aptitude: ${aptitudeScore}/5 (${(aptitudeScore / 5 * 100).toFixed(0)}%)
Round 2 - Technical (${profile.branch} - ${profile.careerPath || profile.branch}): ${technicalScore}/5 (${(technicalScore / 5 * 100).toFixed(0)}%)
Round 3 - AI Interview: ${aiScore}/5 (${(aiScore / 5 * 100).toFixed(0)}%)

AI Interview Responses Quality:
${qaLog.map((qa, i) => `Q${i + 1}: ${qa.feedback.trim().toLowerCase().startsWith('strong') ? 'Strong' : 'Needs Improvement'}`).join('\n')}
      `.trim();

      const prompt = `You are an expert technical interviewer and career counselor specializing in ${profile.branch} department careers. Analyze this candidate's 3-part interview performance for the ${profile.careerPath || profile.branch} role and provide detailed feedback.

${performanceSummary}

Provide your analysis in EXACTLY this JSON format (valid JSON only, no markdown):
{
  "overallAssessment": "2-3 sentence summary of overall performance",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area to improve 1", "area to improve 2", "area to improve 3"],
  "readinessLevel": "Excellent|Good|Fair|Needs Work",
  "recommendations": ["specific actionable recommendation 1", "specific actionable recommendation 2", "specific actionable recommendation 3"]
}

Be constructive, specific, and encouraging. Base readinessLevel on: Excellent (80%+), Good (60-79%), Fair (40-59%), Needs Work (<40%). Consider their department (${profile.branch}) and career path (${profile.careerPath || profile.branch}) in your recommendations.`;

      const response = await groqCall(
        'You are a technical interview evaluator. Respond ONLY with valid JSON, no markdown formatting.',
        prompt
      );

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');

      const validation = JSON.parse(jsonMatch[0]);
      setAIValidation(validation);
      return validation;
    } catch (err) {
      console.error('AI validation failed:', err);
      // Provide fallback validation
      const percentage = (totalScore / totalQuestions) * 100;
      let readinessLevel: 'Excellent' | 'Good' | 'Fair' | 'Needs Work';
      if (percentage >= 80) readinessLevel = 'Excellent';
      else if (percentage >= 60) readinessLevel = 'Good';
      else if (percentage >= 40) readinessLevel = 'Fair';
      else readinessLevel = 'Needs Work';

      const fallback = {
        overallAssessment: `You scored ${totalScore} out of ${totalQuestions} questions correctly (${percentage.toFixed(0)}%). ${
          percentage >= 70 ? 'Strong performance overall!' : percentage >= 50 ? 'Good effort with room for improvement.' : 'Keep practicing and learning.'
        }`,
        strengths: [
          aptitudeScore >= 3 ? 'Good logical and analytical thinking' : '',
          technicalScore >= 3 ? 'Solid technical knowledge' : '',
          aiScore >= 3 ? 'Strong communication skills' : ''
        ].filter(Boolean),
        improvements: [
          aptitudeScore < 3 ? 'Work on logical reasoning and problem-solving' : '',
          technicalScore < 3 ? `Study more ${profile.branch} department and ${profile.careerPath || profile.branch} concepts` : '',
          aiScore < 3 ? 'Practice articulating technical concepts clearly' : ''
        ].filter(Boolean),
        readinessLevel,
        recommendations: [
          'Review incorrect answers to understand concepts better',
          'Practice more mock interviews regularly',
          'Focus on real-world project experience'
        ]
      };
      setAIValidation(fallback);
      return fallback;
    } finally {
      setIsValidating(false);
    }
  };

  const finishAllRounds = async () => {
    try {
      console.log('finishAllRounds called');
      // Calculate total score
      const totalScore = aptitudeScore + technicalScore + aiScore;
      const totalQuestions = (aptitudeQuestions?.length || 0) + (technicalQuestions?.length || 0) + (aiQuestions?.length || 0);
      console.log('Scores:', { totalScore, totalQuestions, aptitudeScore, technicalScore, aiScore });

      // Reset subStage to prevent conflict with 'completed' check
      setSubStage('idle');

      // Switch to final_results immediately and show loading
      setMainStage('final_results');
      console.log('MainStage set to final_results');

      // Generate AI validation in background
      await generateAIValidation(totalScore, totalQuestions);
      console.log('AI validation complete');

      // Save complete session
      logActivity('interview_completed');
      await saveInterviewSession({
        careerPath: profile.careerPath || profile.branch,
        score: totalScore,
        totalQuestions,
        questions: [
          ...aptitudeQuestions.map(q => q.question),
          ...technicalQuestions.map(q => q.question),
          ...aiQuestions
        ],
        answers: [
          ...aptitudeAnswers.map((a, i) => aptitudeQuestions[i]?.options[a] || ''),
          ...technicalAnswers.map((a, i) => technicalQuestions[i]?.options[a] || ''),
          ...qaLog.map(qa => qa.answer)
        ],
        feedback: [
          ...aptitudeQuestions.map((q, i) => aptitudeAnswers[i] === q.correctIndex ? 'Correct' : 'Incorrect'),
          ...technicalQuestions.map((q, i) => technicalAnswers[i] === q.correctIndex ? 'Correct' : 'Incorrect'),
          ...qaLog.map(qa => qa.feedback)
        ],
        summary
      });
      console.log('Session saved');

      await getInterviewSessions().then(setPastSessions).catch(() => {});
    } catch (err) {
      console.error('Error in finishAllRounds:', err);
      // Still show results even if something fails
      setMainStage('final_results');
      setSubStage('idle');
      setIsValidating(false);
    }
  };

  const resetInterview = () => {
    setMainStage('idle');
    setSubStage('idle');
    setAptitudeQuestions([]);
    setAptitudeIndex(0);
    setAptitudeAnswers([]);
    setSelectedAptitude(null);
    setAptitudeScore(0);
    setTechnicalQuestions([]);
    setTechnicalIndex(0);
    setTechnicalAnswers([]);
    setSelectedTechnical(null);
    setTechnicalScore(0);
    setAIQuestions([]);
    setAIIndex(0);
    setCurrentAnswer('');
    setQaLog([]);
    setSummary('');
    setError('');
    setCurrentFeedback('');
    setAIScore(0);
    setCompletedRounds([]);
    setAIValidation(null);
    setIsValidating(false);
  };

  const getScoreColor = (s: number, total: number) => {
    const percentage = (s / total) * 100;
    if (percentage >= 70) return '#10b981';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // IDLE STATE
  if (mainStage === 'idle') {
    return (
      <div className="card interview-card">
        <div className="card-header">
          <MessageSquare size={32} color="#667eea" />
          <div>
            <h2 className="card-title">3-Part Interview System</h2>
            <p className="card-description">Complete Assessment: Aptitude + Technical + HR Round</p>
          </div>
        </div>

        {error && (
          <div className="interview-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="interview-idle-body">
          <div className="interview-3part-grid">
            <div className="interview-3part-card">
              <div className="interview-3part-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Brain size={28} color="white" />
              </div>
              <h3>Round 1: Aptitude</h3>
              <p>5 questions testing logical reasoning, quantitative aptitude, and analytical skills</p>
            </div>
            <div className="interview-3part-card">
              <div className="interview-3part-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <Code size={28} color="white" />
              </div>
              <h3>Round 2: Technical</h3>
              <p>5 MCQ questions tailored to {profile.branch} department and {profile.careerPath || profile.branch} career path</p>
            </div>
            <div className="interview-3part-card">
              <div className="interview-3part-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <MessageSquare size={28} color="white" />
              </div>
              <h3>Round 3: HR Round</h3>
              <p>5 open-ended questions with AI-powered feedback on your responses</p>
            </div>
          </div>

          <div className="interview-how">
            <h3>What to Expect</h3>
            <ul>
              <li><CheckCircle size={14} /> Complete all 3 rounds sequentially</li>
              <li><CheckCircle size={14} /> Get instant feedback after each answer</li>
              <li><CheckCircle size={14} /> Receive detailed performance analysis</li>
              <li><CheckCircle size={14} /> Total time: 20-30 minutes</li>
            </ul>
          </div>

          <button className="btn btn-primary interview-start-btn" type="button" onClick={startInterview}>
            <Play size={20} />
            Start Full Interview
          </button>

          {pastSessions.length > 0 && (
            <div className="interview-history">
              <button
                type="button"
                className="interview-history-toggle"
                onClick={() => setShowHistory(h => !h)}
              >
                <History size={16} />
                Past Interviews ({pastSessions.length})
                <span className="interview-history-chevron">{showHistory ? '▲' : '▼'}</span>
              </button>

              {showHistory && (
                <div className="interview-history-list">
                  {pastSessions.map((s) => (
                    <div key={s.id} className="interview-history-item">
                      <div className="interview-history-meta">
                        <Trophy size={14} color={getScoreColor(s.score, s.totalQuestions)} />
                        <span className="interview-history-date">{formatDate(s.createdAt)}</span>
                        <span className="interview-history-path">{s.careerPath}</span>
                      </div>
                      <div
                        className="interview-history-score"
                        style={{ color: getScoreColor(s.score, s.totalQuestions) }}
                      >
                        {s.score}/{s.totalQuestions}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // STAGE SELECT
  if (mainStage === 'stage_select') {
    const canStartTechnical = completedRounds.some(r => r.roundType === 'aptitude');
    const canStartAI = completedRounds.some(r => r.roundType === 'technical');
    const canFinish = completedRounds.length === 3;

    return (
      <div className="card interview-card">
        <div className="card-header">
          <Target size={32} color="#667eea" />
          <div>
            <h2 className="card-title">Select Interview Round</h2>
            <p className="card-description">Complete each round to unlock the next</p>
          </div>
        </div>

        <div className="interview-stage-select">
          <button
            type="button"
            className={`interview-stage-btn ${completedRounds.some(r => r.roundType === 'aptitude') ? 'interview-stage-btn--completed' : ''}`}
            onClick={startAptitudeRound}
            disabled={completedRounds.some(r => r.roundType === 'aptitude')}
          >
            <div className="interview-stage-btn-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Brain size={32} color="white" />
            </div>
            <div className="interview-stage-btn-content">
              <h3>Round 1: Aptitude Test</h3>
              <p>Logical reasoning & analytical thinking</p>
              {completedRounds.some(r => r.roundType === 'aptitude') && (
                <span className="interview-stage-badge">
                  <CheckCircle size={14} /> Completed: {aptitudeScore}/5
                </span>
              )}
            </div>
            {!completedRounds.some(r => r.roundType === 'aptitude') && <ArrowRight size={20} />}
          </button>

          <button
            type="button"
            className={`interview-stage-btn ${completedRounds.some(r => r.roundType === 'technical') ? 'interview-stage-btn--completed' : ''} ${!canStartTechnical ? 'interview-stage-btn--locked' : ''}`}
            onClick={startTechnicalRound}
            disabled={!canStartTechnical || completedRounds.some(r => r.roundType === 'technical')}
          >
            <div className="interview-stage-btn-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Code size={32} color="white" />
            </div>
            <div className="interview-stage-btn-content">
              <h3>Round 2: Technical MCQs</h3>
              <p>{profile.branch} department - {profile.careerPath || profile.branch} specific</p>
              {completedRounds.some(r => r.roundType === 'technical') && (
                <span className="interview-stage-badge">
                  <CheckCircle size={14} /> Completed: {technicalScore}/5
                </span>
              )}
              {!canStartTechnical && <span className="interview-stage-lock">🔒 Complete Round 1 first</span>}
            </div>
            {canStartTechnical && !completedRounds.some(r => r.roundType === 'technical') && <ArrowRight size={20} />}
          </button>

          <button
            type="button"
            className={`interview-stage-btn ${completedRounds.some(r => r.roundType === 'ai') ? 'interview-stage-btn--completed' : ''} ${!canStartAI ? 'interview-stage-btn--locked' : ''}`}
            onClick={startAIInterview}
            disabled={!canStartAI || completedRounds.some(r => r.roundType === 'ai')}
          >
            <div className="interview-stage-btn-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <MessageSquare size={32} color="white" />
            </div>
            <div className="interview-stage-btn-content">
              <h3>Round 3: HR Round</h3>
              <p>Behavioral and scenario-based questions for {profile.branch} - {profile.careerPath || profile.branch}</p>
              {completedRounds.some(r => r.roundType === 'ai') && (
                <span className="interview-stage-badge">
                  <CheckCircle size={14} /> Completed: {aiScore}/5
                </span>
              )}
              {!canStartAI && <span className="interview-stage-lock">🔒 Complete Round 2 first</span>}
            </div>
            {canStartAI && !completedRounds.some(r => r.roundType === 'ai') && <ArrowRight size={20} />}
          </button>
        </div>

        {canFinish && (
          <button className="btn btn-primary interview-start-btn" type="button" onClick={finishAllRounds}>
            <CheckCircle size={20} />
            View Final Results
          </button>
        )}

        <button className="btn btn-secondary" type="button" onClick={resetInterview} style={{ marginTop: '12px' }}>
          <RotateCcw size={16} /> Start Over
        </button>
      </div>
    );
  }

  // APTITUDE ROUND
  if (mainStage === 'aptitude' && subStage !== 'completed') {
    if (aptitudeQuestions.length === 0) {
      return (
        <div className="card interview-card interview-center">
          <Loader size={40} className="interview-spinner" color="#667eea" />
          <p className="interview-loading-text">Loading aptitude questions…</p>
        </div>
      );
    }

    const currentQ = aptitudeQuestions[aptitudeIndex];
    const isAnswered = selectedAptitude !== null;

    return (
      <div className="card interview-card">
        <div className="card-header">
          <Brain size={32} color="#667eea" />
          <div>
            <h2 className="card-title">Round 1: Aptitude Test</h2>
            <p className="card-description">{currentQ.category.toUpperCase()} • {currentQ.difficulty}</p>
          </div>
        </div>

        <div className="interview-progress-bar-wrap">
          <div className="interview-progress-label">
            Question {aptitudeIndex + 1} of {aptitudeQuestions.length}
          </div>
          <div className="interview-progress-track">
            <div
              className="interview-progress-fill"
              style={{ width: `${((aptitudeIndex + 1) / aptitudeQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="interview-question-card">
          <span className="interview-q-num">Q{aptitudeIndex + 1}</span>
          <p className="interview-question-text">{currentQ.question}</p>
        </div>

        <div className="interview-mcq-options">
          {currentQ.options.map((option, idx) => {
            let className = 'interview-mcq-option';
            if (isAnswered) {
              if (idx === currentQ.correctIndex) className += ' interview-mcq-option--correct';
              else if (idx === selectedAptitude) className += ' interview-mcq-option--wrong';
              else className += ' interview-mcq-option--dim';
            } else if (selectedAptitude === idx) {
              className += ' interview-mcq-option--selected';
            }

            return (
              <button
                type="button"
                key={idx}
                className={className}
                onClick={() => handleAptitudeSelect(idx)}
                disabled={isAnswered}
              >
                <span className="interview-mcq-letter">{String.fromCharCode(65 + idx)}</span>
                <span>{option}</span>
                {isAnswered && idx === currentQ.correctIndex && <CheckCircle size={18} />}
                {isAnswered && idx === selectedAptitude && idx !== currentQ.correctIndex && <AlertCircle size={18} />}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className={`interview-feedback ${selectedAptitude === currentQ.correctIndex ? 'interview-feedback--good' : 'interview-feedback--improve'}`}>
            {selectedAptitude === currentQ.correctIndex ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <p><strong>{selectedAptitude === currentQ.correctIndex ? 'Correct!' : 'Incorrect.'}</strong> {currentQ.explanation}</p>
          </div>
        )}

        <div className="interview-actions">
          {isAnswered && (
            <button className="btn btn-primary" type="button" onClick={nextAptitudeQuestion}>
              {aptitudeIndex + 1 >= aptitudeQuestions.length ? 'Finish Round 1' : 'Next Question'}
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // TECHNICAL ROUND
  if (mainStage === 'technical' && subStage !== 'completed') {
    if (technicalQuestions.length === 0) {
      return (
        <div className="card interview-card interview-center">
          <Loader size={40} className="interview-spinner" color="#f5576c" />
          <p className="interview-loading-text">Loading technical questions…</p>
        </div>
      );
    }

    const currentQ = technicalQuestions[technicalIndex];
    const isAnswered = selectedTechnical !== null;

    return (
      <div className="card interview-card">
        <div className="card-header">
          <Code size={32} color="#f5576c" />
          <div>
            <h2 className="card-title">Round 2: Technical Questions</h2>
            <p className="card-description">{currentQ.category} • {currentQ.difficulty}</p>
          </div>
        </div>

        <div className="interview-progress-bar-wrap">
          <div className="interview-progress-label">
            Question {technicalIndex + 1} of {technicalQuestions.length}
          </div>
          <div className="interview-progress-track">
            <div
              className="interview-progress-fill"
              style={{ width: `${((technicalIndex + 1) / technicalQuestions.length) * 100}%`, background: 'linear-gradient(90deg, #f093fb, #f5576c)' }}
            />
          </div>
        </div>

        <div className="interview-question-card">
          <span className="interview-q-num" style={{ background: '#f5576c' }}>Q{technicalIndex + 1}</span>
          <p className="interview-question-text">{currentQ.question}</p>
        </div>

        <div className="interview-mcq-options">
          {currentQ.options.map((option, idx) => {
            let className = 'interview-mcq-option';
            if (isAnswered) {
              if (idx === currentQ.correctIndex) className += ' interview-mcq-option--correct';
              else if (idx === selectedTechnical) className += ' interview-mcq-option--wrong';
              else className += ' interview-mcq-option--dim';
            } else if (selectedTechnical === idx) {
              className += ' interview-mcq-option--selected';
            }

            return (
              <button
                type="button"
                key={idx}
                className={className}
                onClick={() => handleTechnicalSelect(idx)}
                disabled={isAnswered}
              >
                <span className="interview-mcq-letter">{String.fromCharCode(65 + idx)}</span>
                <span>{option}</span>
                {isAnswered && idx === currentQ.correctIndex && <CheckCircle size={18} />}
                {isAnswered && idx === selectedTechnical && idx !== currentQ.correctIndex && <AlertCircle size={18} />}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className={`interview-feedback ${selectedTechnical === currentQ.correctIndex ? 'interview-feedback--good' : 'interview-feedback--improve'}`}>
            {selectedTechnical === currentQ.correctIndex ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <p><strong>{selectedTechnical === currentQ.correctIndex ? 'Correct!' : 'Incorrect.'}</strong> {currentQ.explanation}</p>
          </div>
        )}

        <div className="interview-actions">
          {isAnswered && (
            <button className="btn btn-primary" type="button" onClick={nextTechnicalQuestion}>
              {technicalIndex + 1 >= technicalQuestions.length ? 'Finish Round 2' : 'Next Question'}
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // AI INTERVIEW ROUND (IN PROGRESS OR REVIEWING)
  if (mainStage === 'ai_interview' && (subStage === 'in_progress' || subStage === 'reviewing')) {
    const feedbackIsGood = currentFeedback.trim().toLowerCase().startsWith('strong');
    return (
      <div className="card interview-card">
        <div className="card-header">
          <MessageSquare size={32} color="#00f2fe" />
          <div>
            <h2 className="card-title">Round 3: HR Round</h2>
            <p className="card-description">Conversational Interview • Open-Ended Questions</p>
          </div>
        </div>

        <div className="interview-progress-bar-wrap">
          <div className="interview-progress-label">
            Question {aiIndex + 1} of {aiQuestions.length}
          </div>
          <div className="interview-progress-track">
            <div
              className="interview-progress-fill"
              style={{ width: `${((aiIndex + 1) / aiQuestions.length) * 100}%`, background: 'linear-gradient(90deg, #4facfe, #00f2fe)' }}
            />
          </div>
        </div>

        <div className="interview-question-card">
          <span className="interview-q-num" style={{ background: '#00f2fe' }}>Q{aiIndex + 1}</span>
          <p className="interview-question-text">{aiQuestions[aiIndex]}</p>
        </div>

        <div className="interview-answer-section">
          <label className="interview-answer-label">Your Answer</label>
          <textarea
            className="interview-textarea"
            rows={6}
            placeholder="Share your thoughts in detail... be specific and use examples from your experience."
            value={currentAnswer}
            onChange={e => setCurrentAnswer(e.target.value)}
            disabled={subStage === 'reviewing' || isLoadingFeedback}
          />
        </div>

        {subStage === 'reviewing' && currentFeedback && (
          <div className={`interview-feedback ${feedbackIsGood ? 'interview-feedback--good' : 'interview-feedback--improve'}`}>
            {feedbackIsGood ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <p>{currentFeedback}</p>
          </div>
        )}

        <div className="interview-actions">
          {subStage === 'in_progress' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={submitAIAnswer}
              disabled={!currentAnswer.trim() || isLoadingFeedback}
            >
              {isLoadingFeedback
                ? <><Loader size={16} className="interview-spinner-sm" /> Analyzing…</>
                : <>Submit Answer</>}
            </button>
          )}
          {subStage === 'reviewing' && (
            <button className="btn btn-primary" type="button" onClick={nextAIQuestion}>
              {aiIndex + 1 >= aiQuestions.length ? 'Finish Round 3' : 'Next Question'}
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (subStage === 'generating') {
    return (
      <div className="card interview-card interview-center">
        <Loader size={40} className="interview-spinner" color="#667eea" />
        <p className="interview-loading-text">
          {mainStage === 'ai_interview' ? 'Generating AI interview questions…' : 'Processing…'}
        </p>
      </div>
    );
  }

  // ROUND COMPLETED - Return to stage select
  if (subStage === 'completed' && mainStage !== 'final_results') {
    setTimeout(() => setMainStage('stage_select'), 100);
    return (
      <div className="card interview-card interview-center">
        <CheckCircle size={50} color="#10b981" />
        <p className="interview-loading-text">Round completed! Returning to menu…</p>
      </div>
    );
  }

  // FINAL RESULTS
  if (mainStage === 'final_results') {
    console.log('Rendering final results, isValidating:', isValidating);
    const totalScore = aptitudeScore + technicalScore + aiScore;
    const totalQuestions = (aptitudeQuestions?.length || 5) + (technicalQuestions?.length || 5) + (aiQuestions?.length || 5);
    const percentage = Math.round((totalScore / totalQuestions) * 100);
    console.log('Final results data:', { totalScore, totalQuestions, percentage });

    // Show loading state while AI validation is in progress
    if (isValidating) {
      return (
        <div className="card interview-card interview-center">
          <Loader size={40} className="interview-spinner" color="#667eea" />
          <p className="interview-loading-text">Generating AI-validated results...</p>
          <p style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>
            Analyzing your performance across all rounds
          </p>
        </div>
      );
    }

    const getReadinessColor = (level: string) => {
      switch (level) {
        case 'Excellent': return '#10b981';
        case 'Good': return '#3b82f6';
        case 'Fair': return '#f59e0b';
        case 'Needs Work': return '#ef4444';
        default: return '#667eea';
      }
    };

    return (
      <div className="card interview-card">
        <div className="card-header">
          <Trophy size={32} color="#667eea" />
          <div>
            <h2 className="card-title">Interview Complete!</h2>
            <p className="card-description">AI-Validated Assessment Results</p>
          </div>
        </div>

        <div className="interview-score-banner" style={{ borderColor: getScoreColor(totalScore, totalQuestions) }}>
          <div className="interview-score-value" style={{ color: getScoreColor(totalScore, totalQuestions) }}>
            {totalScore} / {totalQuestions}
          </div>
          <div className="interview-score-label">{percentage}% Overall Score</div>
        </div>

        {aiValidation && (
          <>
            <div className="interview-readiness-badge" style={{
              background: `linear-gradient(135deg, ${getReadinessColor(aiValidation.readinessLevel)}15 0%, ${getReadinessColor(aiValidation.readinessLevel)}05 100%)`,
              borderColor: getReadinessColor(aiValidation.readinessLevel)
            }}>
              <CheckCircle size={20} color={getReadinessColor(aiValidation.readinessLevel)} />
              <div>
                <div className="interview-readiness-label">Interview Readiness</div>
                <div className="interview-readiness-level" style={{ color: getReadinessColor(aiValidation.readinessLevel) }}>
                  {aiValidation.readinessLevel}
                </div>
              </div>
            </div>

            <div className="interview-ai-assessment">
              <h3>
                <Brain size={18} />
                AI Performance Analysis
              </h3>
              <p className="interview-ai-overall">{aiValidation.overallAssessment}</p>
            </div>

            <div className="interview-ai-insights">
              <div className="interview-ai-insight-card interview-ai-insight-card--strengths">
                <div className="interview-ai-insight-header">
                  <CheckCircle size={18} />
                  <h4>Key Strengths</h4>
                </div>
                <ul>
                  {aiValidation.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>

              <div className="interview-ai-insight-card interview-ai-insight-card--improvements">
                <div className="interview-ai-insight-header">
                  <AlertCircle size={18} />
                  <h4>Areas to Improve</h4>
                </div>
                <ul>
                  {aiValidation.improvements.map((improvement, i) => (
                    <li key={i}>{improvement}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="interview-recommendations">
              <h3>
                <Target size={18} />
                Personalized Recommendations
              </h3>
              <ul>
                {aiValidation.recommendations.map((rec, i) => (
                  <li key={i}>
                    <ChevronRight size={16} />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="interview-final-breakdown">
          <h3>Round-wise Performance</h3>
          <div className="interview-breakdown-grid">
            <div className="interview-breakdown-card">
              <Brain size={24} color="#667eea" />
              <div>
                <div className="interview-breakdown-label">Aptitude</div>
                <div className="interview-breakdown-score" style={{ color: getScoreColor(aptitudeScore, 5) }}>
                  {aptitudeScore}/5
                </div>
              </div>
            </div>
            <div className="interview-breakdown-card">
              <Code size={24} color="#f5576c" />
              <div>
                <div className="interview-breakdown-label">Technical</div>
                <div className="interview-breakdown-score" style={{ color: getScoreColor(technicalScore, 5) }}>
                  {technicalScore}/5
                </div>
              </div>
            </div>
            <div className="interview-breakdown-card">
              <MessageSquare size={24} color="#00f2fe" />
              <div>
                <div className="interview-breakdown-label">HR Round</div>
                <div className="interview-breakdown-score" style={{ color: getScoreColor(aiScore, 5) }}>
                  {aiScore}/5
                </div>
              </div>
            </div>
          </div>
        </div>

        {summary && (
          <div className="interview-summary">
            <h3>Session Summary</h3>
            <p>{summary}</p>
          </div>
        )}

        <div className="interview-final-actions">
          <button className="btn btn-primary interview-start-btn" type="button" onClick={resetInterview}>
            <RotateCcw size={18} /> Start New Interview
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default MockInterview;
