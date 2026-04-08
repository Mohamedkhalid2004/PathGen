import React from 'react';
import type { Skill, WeeklyTask } from '../types';
import { Calendar, Clock, CheckCircle } from 'lucide-react';


interface Props {
  skills: Skill[];
}

const WeeklyPlan: React.FC<Props> = ({ skills }) => {
  const weeklyTasks: WeeklyTask[] = skills.map((skill, index) => ({
    week: index + 1,
    skill: skill.name,
    skillId: skill.id,
    description: skill.description,
    estimatedHours: 8,
  }));

  const currentWeek = skills.filter(s => !s.completed).length > 0 
    ? skills.findIndex(s => !s.completed) + 1
    : skills.length;

  return (
    <div className="card">
      <div className="card-header">
        <Calendar size={32} color="#667eea" />
        <div>
          <h2 className="card-title">Weekly Learning Plan</h2>
          <p className="card-description">
            Structured weekly targets • Currently on Week {currentWeek}
          </p>
        </div>
      </div>

      <div className="grid-2">
        {weeklyTasks.map((task) => {
          const skill = skills.find(s => s.id === task.skillId);
          const isCompleted = skill?.completed || false;
          const isCurrent = task.week === currentWeek;

          return (
            <div
              key={task.week}
              style={{
                border: `2px solid ${isCurrent ? '#667eea' : isCompleted ? '#10b981' : '#e0e0e0'}`,
                borderRadius: '12px',
                padding: '20px',
                background: isCompleted ? '#f0fdf4' : isCurrent ? '#f0f0ff' : 'white',
                position: 'relative',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: isCompleted ? '#10b981' : isCurrent ? '#667eea' : '#e0e0e0',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                Week {task.week}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700',
                  marginBottom: '8px',
                  color: '#1a1a1a',
                  paddingRight: '80px'
                }}>
                  {task.skill}
                </h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
                  {task.description}
                </p>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#666' }}>
                  <Clock size={16} />
                  {task.estimatedHours} hours
                </div>
                
                {isCompleted && (
                  <span className="badge badge-success">
                    <CheckCircle size={14} />
                    Done
                  </span>
                )}
                
                {isCurrent && !isCompleted && (
                  <span className="badge badge-info">
                    Current Week
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {weeklyTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>No weekly plan available yet</p>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlan;