import React from 'react';
import type { Skill } from '../types';
import { Map, CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface Props {
  skills: Skill[];
  careerPath: string;
  onSkillComplete: (skillId: string) => void;
}

const CareerRoadmap: React.FC<Props> = ({ skills, careerPath, onSkillComplete }) => {
  return (
    <div className="card">
      <div className="card-header">
        <Map size={32} color="#667eea" />
        <div>
          <h2 className="card-title">{careerPath} Roadmap</h2>
          <p className="card-description">Your personalized learning path</p>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {skills.map((skill, index) => (
          <div key={skill.id}>
            <div className={`skill-item ${skill.completed ? 'completed' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <div style={{ 
                  background: skill.completed ? '#10b981' : '#e0e0e0',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>
                
                <div className="skill-info">
                  <div className="skill-name">{skill.name}</div>
                  <div className="skill-description">{skill.description}</div>
                  {skill.prerequisites.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        Prerequisites: {skill.prerequisites.map(preId => {
                          const preSkill = skills.find(s => s.id === preId);
                          return preSkill?.name;
                        }).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                {skill.completed ? (
                  <span className="badge badge-success">
                    <CheckCircle size={16} />
                    Completed
                  </span>
                ) : (
                  <button
                    onClick={() => onSkillComplete(skill.id)}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>

            {index < skills.length - 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                padding: '8px 0',
                color: '#ccc'
              }}>
                <ArrowRight size={24} />
              </div>
            )}
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#999'
        }}>
          <Circle size={48} style={{ margin: '0 auto 16px' }} />
          <p>No roadmap available. Please complete your profile.</p>
        </div>
      )}
    </div>
  );
};

export default CareerRoadmap;