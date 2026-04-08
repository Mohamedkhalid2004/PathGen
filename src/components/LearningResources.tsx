import React, { useState, useEffect } from 'react';
import type { Skill, LearningResource } from '../types';
import { getLearningResources } from '../lib/api';
import { Code, Youtube, BookOpen, ExternalLink, Star } from 'lucide-react';


interface Props {
  skills: Skill[];
}

const LearningResources: React.FC<Props> = ({ skills }) => {
  const [selectedSkill, setSelectedSkill] = useState<string>(skills[0]?.id || '');
  const [resources, setResources] = useState<LearningResource[]>([]);

  const currentSkill = skills.find(s => s.id === selectedSkill);

  useEffect(() => {
    if (!selectedSkill) return;
    getLearningResources(selectedSkill).then(setResources).catch(console.error);
  }, [selectedSkill]);

  return (
    <div className="card" style={{ color: '#000' }}>
      <div className="card-header">
        <Code size={32} color="#667eea" />
        <div>
          <h2 className="card-title" style={{ color: '#000' }}>
            Learning Resources
          </h2>
          <p className="card-description" style={{ color: '#000' }}>
            Curated resources for each skill
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            fontWeight: '600',
            marginBottom: '8px',
            display: 'block',
            color: '#000'
          }}
        >
          Select a Skill
        </label>

        <select
          className="form-select"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          style={{ color: '#000' }}
        >
          {skills.map(skill => (
            <option key={skill.id} value={skill.id}>
              {skill.name} {skill.completed ? '✓' : ''}
            </option>
          ))}
        </select>
      </div>

      {currentSkill && (
        <div
          style={{
            background: currentSkill.completed ? '#f0fdf4' : '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: `2px solid ${
              currentSkill.completed ? '#10b981' : '#e5e7eb'
            }`,
            color: '#000'
          }}
        >
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '8px',
              color: '#000'
            }}
          >
            {currentSkill.name}
          </h3>

          <p style={{ marginBottom: '12px', color: '#000' }}>
            {currentSkill.description}
          </p>

          {currentSkill.completed && (
            <span className="badge badge-success">Completed ✓</span>
          )}
        </div>
      )}

      <div>
        <h4
          style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#000'
          }}
        >
          Available Resources
        </h4>

        {resources.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {resources.map(resource => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="resource-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: '#ffffff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  color: '#000'
                }}
              >
                <div
                  style={{
                    background:
                      resource.type === 'video'
                        ? '#ff0000'
                        : resource.type === 'documentation'
                        ? '#667eea'
                        : '#10b981',
                    color: 'white',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {resource.type === 'video' && <Youtube size={24} />}
                  {resource.type === 'documentation' && <BookOpen size={24} />}
                  {resource.type === 'course' && <Code size={24} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: '600',
                      fontSize: '16px',
                      marginBottom: '4px',
                      color: '#000'
                    }}
                  >
                    {resource.title}
                  </div>

                  <div
                    style={{
                      fontSize: '14px',
                      marginBottom: '6px',
                      color: '#000'
                    }}
                  >
                    {resource.platform}
                  </div>

                  {resource.rating && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Star size={14} fill="#fbbf24" color="#fbbf24" />
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#000'
                        }}
                      >
                        {resource.rating}
                      </span>
                    </div>
                  )}
                </div>

                <span
                  className={`badge ${
                    resource.type === 'video'
                      ? 'badge-warning'
                      : resource.type === 'documentation'
                      ? 'badge-info'
                      : 'badge-success'
                  }`}
                >
                  {resource.type}
                </span>

                <ExternalLink size={20} color="#000" />
              </a>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#ffffff',
              borderRadius: '12px',
              color: '#000'
            }}
          >
            <Code size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p>No resources available for this skill yet</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Check back soon for curated learning materials
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningResources;
