import React, { useState, useEffect } from 'react';
import type { Skill, LearningResource } from '../types';
import { getSkills, getLearningResources } from '../lib/api';
import {
  Compass, BookOpen, Code, Youtube, ExternalLink, Star,
  Loader, ChevronDown, ChevronRight, Layers,
} from 'lucide-react';
import '../css/ExploreCareerView.css';

interface Props {
  careerPath: string;
  branch: string;
}

const TYPE_COLOR: Record<string, string> = {
  video: '#ef4444',
  documentation: '#667eea',
  course: '#10b981',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  video: <Youtube size={22} />,
  documentation: <BookOpen size={22} />,
  course: <Code size={22} />,
};

const ExploreCareerView: React.FC<Props> = ({ careerPath, branch }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [resources, setResources] = useState<Record<string, LearningResource[]>>({});
  const [loadingRes, setLoadingRes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    setSkills([]);
    setExpandedSkill(null);
    getSkills(careerPath)
      .then(setSkills)
      .catch(() => setLoadError('Failed to load skills. Please try again.'))
      .finally(() => setLoading(false));
  }, [careerPath]);

  const toggleSkill = async (skillId: string) => {
    if (expandedSkill === skillId) {
      setExpandedSkill(null);
      return;
    }
    setExpandedSkill(skillId);
    if (!resources[skillId]) {
      setLoadingRes(prev => ({ ...prev, [skillId]: true }));
      getLearningResources(skillId)
        .then(res => setResources(prev => ({ ...prev, [skillId]: res })))
        .catch(() => setResources(prev => ({ ...prev, [skillId]: [] })))
        .finally(() => setLoadingRes(prev => ({ ...prev, [skillId]: false })));
    }
  };

  return (
    <div className="card ecv-card">
      {/* Header */}
      <div className="card-header">
        <Compass size={32} color="#667eea" />
        <div>
          <h2 className="card-title">Exploring: {careerPath}</h2>
          <p className="card-description">{branch} department · Courses &amp; learning resources</p>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="ecv-center">
          <Loader size={28} className="ecv-spinner" />
          <p>Loading skills…</p>
        </div>
      )}

      {loadError && (
        <div className="ecv-error">{loadError}</div>
      )}

      {/* Skills list */}
      {!loading && !loadError && skills.length === 0 && (
        <div className="ecv-center ecv-empty">
          <Layers size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
          <p>No skills found for this career path yet.</p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Check back soon!</p>
        </div>
      )}

      {!loading && skills.length > 0 && (
        <div className="ecv-skills-list">
          <p className="ecv-skills-count">{skills.length} skill{skills.length !== 1 ? 's' : ''} in this path</p>
          {skills.map((skill, idx) => {
            const isOpen = expandedSkill === skill.id;
            const skillResources = resources[skill.id] ?? [];
            const isLoadingRes = loadingRes[skill.id];

            return (
              <div
                key={skill.id}
                className={`ecv-skill-card${isOpen ? ' ecv-skill-card--open' : ''}`}
              >
                <button
                  type="button"
                  className="ecv-skill-header"
                  onClick={() => toggleSkill(skill.id)}
                >
                  <span className="ecv-skill-number">{idx + 1}</span>
                  <div className="ecv-skill-info">
                    <span className="ecv-skill-name">{skill.name}</span>
                    <span className="ecv-skill-desc">{skill.description}</span>
                  </div>
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                {isOpen && (
                  <div className="ecv-resources">
                    {isLoadingRes && (
                      <div className="ecv-res-loading">
                        <Loader size={18} className="ecv-spinner" /> Loading resources…
                      </div>
                    )}

                    {!isLoadingRes && skillResources.length === 0 && (
                      <p className="ecv-res-empty">No resources available for this skill yet.</p>
                    )}

                    {!isLoadingRes && skillResources.length > 0 && (
                      <div className="ecv-res-list">
                        {skillResources.map(res => (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ecv-res-item"
                          >
                            <span
                              className="ecv-res-icon"
                              style={{ background: TYPE_COLOR[res.type] ?? '#667eea' }}
                            >
                              {TYPE_ICON[res.type]}
                            </span>
                            <div className="ecv-res-body">
                              <span className="ecv-res-title">{res.title}</span>
                              <span className="ecv-res-platform">{res.platform}</span>
                              {res.rating != null && (
                                <span className="ecv-res-rating">
                                  <Star size={12} fill="#fbbf24" color="#fbbf24" />
                                  {res.rating}
                                </span>
                              )}
                            </div>
                            <span className={`badge badge-${res.type === 'video' ? 'warning' : res.type === 'documentation' ? 'info' : 'success'}`}>
                              {res.type}
                            </span>
                            <ExternalLink size={16} color="#9ca3af" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExploreCareerView;
