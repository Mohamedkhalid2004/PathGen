import React, { useState, useEffect } from 'react';
import type { Skill, Internship } from '../types';
import { getInternships } from '../lib/api';
import { Briefcase, MapPin, Clock, DollarSign, Shield, ExternalLink } from 'lucide-react';


interface Props {
  skills: Skill[];
  careerPath?: string;
}

const InternshipRecommendations: React.FC<Props> = ({ skills, careerPath }) => {
  const [fetchedInternships, setFetchedInternships] = useState<Internship[]>([]);

  useEffect(() => {
    if (!careerPath) return;
    getInternships(careerPath).then(setFetchedInternships).catch(console.error);
  }, [careerPath]);

  const internshipsWithMatch = fetchedInternships.map(internship => {
    const matchedSkills = internship.requiredSkills.filter(skillId => {
      const skill = skills.find(s => s.id === skillId);
      return skill?.completed;
    });

    const matchPercentage = internship.requiredSkills.length > 0
      ? Math.round((matchedSkills.length / internship.requiredSkills.length) * 100)
      : 100;

    return {
      ...internship,
      matchPercentage,
      matchedSkills: matchedSkills.length,
      isQualified: matchPercentage >= 80
    };
  });

  const sortedInternships = [...internshipsWithMatch].sort((a, b) => {
    if (a.isQualified !== b.isQualified) return a.isQualified ? -1 : 1;
    if (a.matchPercentage !== b.matchPercentage) return b.matchPercentage - a.matchPercentage;
    return b.trustScore - a.trustScore;
  });

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'remote': return '🌐';
      case 'onsite': return '🏢';
      case 'hybrid': return '🔄';
      default: return '📍';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="card">
      <div className="card-header">
        <Briefcase size={32} color="#667eea" />
        <div>
          <h2 className="card-title">Internship Recommendations</h2>
          <p className="card-description">Matched opportunities with trust filtering {careerPath && `(${careerPath})`}</p>
        </div>
      </div>

      <div style={{
        background: '#d1eafc',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Shield size={24} color="#3b82f6" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1e40af' }}>
            Trust Score Filtering Active
          </div>
          <div style={{ fontSize: '14px', color: '#3b82f6' }}>
            All internships are verified and scored for authenticity
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sortedInternships.map(internship => (
          <div
            key={internship.id}
            style={{
              border: `2px solid ${internship.isQualified ? '#10b981' : '#e0e0e0'}`,
              borderRadius: '16px',
              padding: '24px',
              background: internship.isQualified ? '#f0fdf4' : 'white',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: internship.isQualified ? '#10b981' : '#f59e0b',
              color: 'lightblack',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              {internship.matchPercentage}% Match
            </div>

            <div style={{ marginBottom: '16px', paddingRight: '120px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px', color: '#071f8c' }}>
                {internship.role}
              </h3>
              <div style={{ fontSize: '16px', color: '#071f8c', fontWeight: '600' }}>
                {internship.company}
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '16px',
              paddingBottom: '16px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#666' }}>
                <MapPin size={16} />
                {getLocationIcon(internship.type)} {internship.location}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#666' }}>
                <Clock size={16} />
                {internship.duration}
              </div>
              {internship.stipend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                  <DollarSign size={16} />
                  {internship.stipend}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} color={getTrustScoreColor(internship.trustScore)} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Trust Score</span>
                </div>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: getTrustScoreColor(internship.trustScore)
                }}>
                  {internship.trustScore}/100
                </span>
              </div>
              <div className="progress-bar">
                <div
                  style={{
                    height: '100%',
                    width: `${internship.trustScore}%`,
                    background: getTrustScoreColor(internship.trustScore),
                    borderRadius: '10px',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>
                Required Skills ({internship.matchedSkills}/{internship.requiredSkills.length}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {internship.requiredSkills.length > 0 ? (
                  internship.requiredSkills.map(skillId => {
                    const skill = skills.find(s => s.id === skillId);
                    const hasSkill = skill?.completed;
                    return (
                      <span
                        key={skillId}
                        className={`badge ${hasSkill ? 'badge-success' : 'badge-warning'}`}
                      >
                        {skill?.name || 'Unknown Skill'} {hasSkill && '✓'}
                      </span>
                    );
                  })
                ) : (
                  <span className="badge badge-info">
                    No specific skills required
                  </span>
                )}
              </div>
            </div>

            {internship.isQualified ? (
              <a
                href={internship.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success"
                style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <ExternalLink size={18} />
                Apply Now
              </a>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                disabled
              >
                Complete {internship.requiredSkills.length - internship.matchedSkills} more skills to qualify
              </button>
            )}
          </div>
        ))}
      </div>

      {sortedInternships.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <Briefcase size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>No internships available yet</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            Complete your skills to get personalized recommendations
          </p>
        </div>
      )}
    </div>
  );
};

export default InternshipRecommendations;
