import React from 'react';
import type { Skill } from '../types';
import { TrendingUp, Target, Award, AlertCircle } from 'lucide-react';

interface Props {
  skills: Skill[];
  completedProjects: string[];
}

const ProgressTracker: React.FC<Props> = ({ skills, completedProjects }) => {
  const totalSkills = skills.length;
  const completedSkills = skills.filter(s => s.completed).length;
  const remainingSkills = totalSkills - completedSkills;
  const progressPercentage = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

  const skillGaps = skills.filter(skill => {
    if (skill.completed) return false;
    const prereqsMet = skill.prerequisites.every(preId => {
      const preSkill = skills.find(s => s.id === preId);
      return preSkill?.completed;
    });
    return prereqsMet;
  });

  return (
    <div className="card">
      <div className="card-header">
        <TrendingUp size={32} color="#667eea" />
        <div>
          <h2 className="card-title">Progress Tracker</h2>
          <p className="card-description">Track your learning journey</p>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px',
          color: '#3b3b3b'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Overall Progress</h3>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
            {progressPercentage}%
          </span>
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '14px',
          color: '#3b3b3b',
          marginTop: '8px'
        }}>
          <span>{completedSkills} completed</span>
          <span>{remainingSkills} remaining</span>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '32px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'lightblack',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <Target size={28} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
            {completedSkills}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Skills Mastered</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'lightblack',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <Award size={28} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
            {completedProjects.length}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Projects Done</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'lightblack',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
            {skillGaps.length}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Skill Gaps</div>
        </div>
      </div>

      {skillGaps.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Ready to Learn (Prerequisites Met)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {skillGaps.map(skill => (
              <div
                key={skill.id}
                style={{
                  padding: '16px',
                  background: '#fff7ed',
                  border: '2px solid #f59e0b',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#92400e'
                }}
              >
                <AlertCircle size={24} color="#f59e0b" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {skill.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {skill.description}
                  </div>
                </div>
                <span className="badge badge-warning">Action Needed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {skillGaps.length === 0 && completedSkills < totalSkills && (
        <div style={{
          padding: '20px',
          background: '#f0f9ff',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#1e40af'
        }}>
          <p>
            Keep going! Complete your current skills to unlock more learning opportunities.
          </p>
        </div>
      )}

      {completedSkills === totalSkills && totalSkills > 0 && (
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'black'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Amazing Progress!</h3>
          <p style={{ opacity: 0.9 }}>
            You've completed all skills in your roadmap. Time to apply for internships!
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;