import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import type { StudentProfile, Skill } from '../types';

interface Props {
  profile: StudentProfile;
  skills: Skill[];
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string ;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const RobotFace: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
      <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#7df9ff" />
        <stop offset="100%" stopColor="#00b4d8" />
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect x="37" y="4" width="6" height="14" rx="3" fill="#764ba2" />
    <circle cx="40" cy="4" r="5" fill="#667eea" filter="url(#glow)" />
    <rect x="10" y="16" width="60" height="48" rx="14" fill="url(#headGrad)" />
    <circle cx="10" cy="36" r="5" fill="#5568c8" />
    <circle cx="70" cy="36" r="5" fill="#5568c8" />
    <rect x="18" y="26" width="18" height="16" rx="5" fill="#1c1c3a" />
    <rect x="44" y="26" width="18" height="16" rx="5" fill="#1c1c3a" />
    <ellipse cx="27" cy="34" rx="7" ry="6" fill="url(#eyeGlow)" filter="url(#glow)" />
    <ellipse cx="53" cy="34" rx="7" ry="6" fill="url(#eyeGlow)" filter="url(#glow)" />
    <circle cx="30" cy="31" r="2" fill="white" opacity="0.7" />
    <circle cx="56" cy="31" r="2" fill="white" opacity="0.7" />
    <rect x="22" y="50" width="36" height="8" rx="4" fill="#1c1c3a" />
    <rect x="25" y="52" width="6" height="4" rx="2" fill="#7df9ff" />
    <rect x="34" y="52" width="6" height="4" rx="2" fill="#7df9ff" />
    <rect x="43" y="52" width="6" height="4" rx="2" fill="#7df9ff" />
  </svg>
);

const TypingDots: React.FC = () => (
  <div className="chatbot-typing">
    <span /><span /><span />
  </div>
);

const AIChatbot: React.FC<Props> = ({ profile, skills }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'bot',
      text: `Hi ${profile.name}! I'm PathBot, your AI career guide. Ask me anything about your ${profile.careerPath || profile.branch} journey — skills, projects, resources, or career advice!`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const buildSystemContext = () => {
    const completedSkills = skills.filter(s => s.completed).map(s => s.name);
    const pendingSkills = skills.filter(s => !s.completed).map(s => s.name);
    const progress = skills.length > 0 ? Math.round((completedSkills.length / skills.length) * 100) : 0;

    return `You are PathBot, an enthusiastic and knowledgeable AI career guide for PathFinder+, an engineering student career platform.

Student Profile:
- Name: ${profile.name}
- Branch: ${profile.branch}
- Year: Year ${profile.year}
- Career Goal: ${profile.careerPath || 'Not set yet'}
- Interests: ${profile.interests.join(', ')}

Skills Progress: ${progress}% complete (${completedSkills.length}/${skills.length} skills)
Completed Skills: ${completedSkills.length > 0 ? completedSkills.join(', ') : 'None yet'}
Next Skills to Learn: ${pendingSkills.slice(0, 5).join(', ')}

Your role:
- Give personalized, concise career advice (2-4 sentences max per reply)
- Suggest next steps based on their actual skill progress
- Be encouraging, friendly, and specific to engineering careers
- Help with skill roadmap, project ideas, internship tips, and resume advice
- Always relate advice to their specific career path: ${profile.careerPath || profile.branch}`;
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    if (!GROQ_API_KEY) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: 'Something went wrong.',
        },
      ]);
      setIsLoading(false);
      return;
    }

    const history = updatedMessages.slice(1).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: buildSystemContext() },
            ...history,
          ],
          max_tokens: 512,
          temperature: 0.7,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const apiMsg = data?.error?.message ?? `HTTP ${res.status}`;
        console.error('[PathBot] Groq API error:', data);
        throw new Error(apiMsg);
      }

      const reply: string =
        data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't get a response. Try again!";

      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'bot', text: reply },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[PathBot] Error:', msg);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: `Error: ${msg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <>
      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar-small">
                <RobotFace size={38} />
              </div>
              <div>
                <div className="chatbot-bot-name">PathBot</div>
                <div className="chatbot-bot-status">
                  <span className="chatbot-status-dot" />
                  AI Career Guide
                </div>
              </div>
            </div>
            <button
              type="button"
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chatbot-msg-row chatbot-msg-row--${msg.role}`}>
                {msg.role === 'bot' && (
                  <div className="chatbot-msg-avatar">
                    <RobotFace size={28} />
                  </div>
                )}
                <div className={`chatbot-bubble chatbot-bubble--${msg.role}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-msg-row chatbot-msg-row--bot">
                <div className="chatbot-msg-avatar">
                  <RobotFace size={28} />
                </div>
                <div className="chatbot-bubble chatbot-bubble--bot">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-row">
            <input
              ref={inputRef}
              className="chatbot-input"
              type="text"
              placeholder="Ask PathBot anything..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              type="button"
              className="chatbot-send-btn"
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button type="button" className="chatbot-fab" onClick={() => setIsOpen(prev => !prev)} aria-label="Open PathBot">
        {isOpen ? (
          <X size={26} color="white" />
        ) : (
          <div className="chatbot-fab-inner">
            <RobotFace size={46} />
          </div>
        )}
        {!isOpen && <span className="chatbot-fab-pulse" />}
      </button>
    </>
  );
};

export default AIChatbot;
