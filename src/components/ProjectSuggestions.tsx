import React, { useState, useEffect } from 'react';
import type { Skill, Project } from '../types';
import { getProjects } from '../lib/api';
import { Code, Clock, CheckCircle, Lock } from 'lucide-react';

interface Props {
  skills: Skill[];
  completedProjects: string[];
  onProjectComplete: (projectId: string) => void;
  careerPath?: string;
}

const ProjectSuggestions: React.FC<Props> = ({ skills, completedProjects, onProjectComplete, careerPath }) => {
  const [fetchedProjects, setFetchedProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!careerPath) return;
    getProjects(careerPath)
      .then(data => setFetchedProjects(data.map(d => d.project)))
      .catch(console.error);
  }, [careerPath]);

  const availableProjects = fetchedProjects.map(project => {
    const requiredSkillsCompleted = project.requiredSkills.filter(skillId => {
      const skill = skills.find(s => s.id === skillId);
      return skill?.completed;
    }).length;

    const isAvailable = requiredSkillsCompleted === project.requiredSkills.length;
    const isCompleted = completedProjects.includes(project.id);

    return {
      ...project,
      isAvailable,
      isCompleted,
      completionPercentage: project.requiredSkills.length > 0
        ? Math.round((requiredSkillsCompleted / project.requiredSkills.length) * 100)
        : 100
    };
  });

  const readyProjects = availableProjects.filter(p => p.isAvailable && !p.isCompleted);
  const completedProjectsList = availableProjects.filter(p => p.isCompleted);
  const lockedProjects = availableProjects.filter(p => !p.isAvailable);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#667eea';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderProjectCard = (project: any, isLocked: boolean = false) => (
    <div
      key={project.id}
      style={{
        border: `2px solid ${project.isCompleted ? '#10b981' : isLocked ? '#e0e0e0' : '#667eea'}`,
        borderRadius: '16px',
        padding: '24px',
        background: project.isCompleted ? '#f0fdf4' : isLocked ? '#f9fafb' : 'white',
        opacity: isLocked ? 0.6 : 1,
        position: 'relative',
        color: isLocked ? '#999999' : 'black'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: getDifficultyColor(project.difficulty),
        color: 'lightblack',
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'capitalize'
      }}>
        {project.difficulty}
      </div>

      <div style={{ marginBottom: '16px', paddingRight: '100px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
          {isLocked && <Lock size={18} style={{ display: 'inline', marginRight: '8px' }} />}
          {project.title}
        </h3>
        <p style={{ color: '#464646', fontSize: '14px', lineHeight: '1.6' }}>
          {project.description}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid #a9a9a9',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#666' }}>
          <Clock size={16} />
          {project.estimatedDuration}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>•</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {project.requiredSkills.length} skills required
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>
          Required Skills:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {project.requiredSkills.length > 0 ? (
            project.requiredSkills.map((skillId: string) => {
              const skill = skills.find(s => s.id === skillId);
              const isSkillCompleted = skill?.completed;
              return (
                <span
                  key={skillId}
                  className={`badge ${isSkillCompleted ? 'badge-success' : 'badge-warning'}`}
                  style={{ fontSize: '12px' }}
                >
                  {skill?.name || 'Unknown Skill'} {isSkillCompleted && '✓'}
                </span>
              );
            })
          ) : (
            <span className="badge badge-info" style={{ fontSize: '12px' }}>
              No specific skills required
            </span>
          )}
        </div>
      </div>

      {!isLocked && !project.isCompleted && (
        <button
          onClick={() => onProjectComplete(project.id)}
          className="btn btn-success"
          style={{ width: '100%' }}
        >
          <CheckCircle size={18} />
          Mark as Complete
        </button>
      )}

      {project.isCompleted && (
        <div style={{
          background: '#10b981',
          color: 'lightblack',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          <CheckCircle size={18} style={{ display: 'inline', marginRight: '8px' }} />
          Completed
        </div>
      )}

      {isLocked && (
        <div style={{
          background: '#aaa9af',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#000000',
          fontSize: '14px'
        }}>
          <Lock size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Complete {project.requiredSkills.length - Math.round((project.completionPercentage / 100) * project.requiredSkills.length)} more skills to unlock
        </div>
      )}
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <Code size={32} color="#667eea" />
        <div>
          <h2 className="card-title">Project Suggestions</h2>
          <p className="card-description">Practice your skills with real projects {careerPath && `(${careerPath})`}</p>
        </div>
      </div>

      {readyProjects.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#10b981' }}>
            ✨ Ready to Build ({readyProjects.length})
          </h3>
          <div className="grid-2">
            {readyProjects.map(project => renderProjectCard(project))}
          </div>
        </div>
      )}

      {completedProjectsList.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Completed Projects ({completedProjectsList.length})
          </h3>
          <div className="grid-2">
            {completedProjectsList.map(project => renderProjectCard(project))}
          </div>
        </div>
      )}

      {lockedProjects.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#da6446' }}>
            🔒 Coming Soon ({lockedProjects.length})
          </h3>
          <div className="grid-2">
            {lockedProjects.map(project => renderProjectCard(project, true))}
          </div>
        </div>
      )}

      {availableProjects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <Code size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>No projects available yet</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            Complete some skills to unlock project suggestions
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectSuggestions;
