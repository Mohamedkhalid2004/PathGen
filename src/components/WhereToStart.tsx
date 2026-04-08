import React, { useState, useEffect } from 'react';
import type { Skill, LearningResource } from '../types';
import { getLearningResources } from '../lib/api';
import { PlayCircle, Youtube, BookOpen, ExternalLink } from 'lucide-react';


interface Props {
  skills: Skill[];
}

const WhereToStart: React.FC<Props> = ({ skills }) => {
  const nextSkill = skills.find(skill => !skill.completed);
  const [resources, setResources] = useState<LearningResource[]>([]);

  useEffect(() => {
    if (!nextSkill) return;
    getLearningResources(nextSkill.id).then(setResources).catch(console.error);
  }, [nextSkill?.id]);

  if (!nextSkill) {
    return (
      <div className="card">
        <div className="card-header">
          <PlayCircle size={32} color="#10b981" />
          <div>
            <h2 className="card-title">Where Should I Start?</h2>
            <p className="card-description">Your next learning step</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Congratulations!</h3>
          <p style={{ color: '#666' }}>You've completed all skills in your roadmap!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <PlayCircle size={32} color="#667eea" />
        <div>
          <h2 className="card-title">Where Should I Start?</h2>
          <p className="card-description">Your next learning step</p>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
          START WITH
        </div>
        <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          {nextSkill.name}
        </h3>
        <p style={{ opacity: 0.9 }}>
          {nextSkill.description}
        </p>
      </div>

      <div>
        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>
          Recommended Learning Resources
        </h4>

        {resources.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {resources.map(resource => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="resource-link"
              >
                <div style={{
                  background: resource.type === 'video' ? '#ff0000' : '#667eea',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {resource.type === 'video' ? <Youtube size={20} /> : <BookOpen size={20} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                    {resource.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {resource.platform}
                  </div>
                </div>

                <ExternalLink size={18} color="#999" />
              </a>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: '#f9fafb',
            borderRadius: '8px',
            color: '#666'
          }}>
            <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>No resources available yet. Check back soon!</p>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#f0f9ff',
        borderRadius: '8px',
        borderLeft: '4px solid #3b82f6'
      }}>
        <p style={{ fontSize: '14px', color: '#1e40af', margin: 0 }}>
          💡 <strong>Pro Tip:</strong> Start with the video tutorial to get an overview,
          then refer to the documentation for deeper understanding.
        </p>
      </div>
    </div>
  );
};

export default WhereToStart;
