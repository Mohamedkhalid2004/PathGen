import React from 'react';
import type { Skill } from '../types';
import { CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface Props {
  skills: Skill[];
  completedProjects: string[];
}

const ReadinessChecker: React.FC<Props> = ({ skills, completedProjects }) => {
  const totalSkills = skills.length;
  const completedSkills = skills.filter(s => s.completed).length;
  const skillsPercentage = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

  const minSkillsPercentage = 70;
  const minProjects = 2;

  const skillsReady = skillsPercentage >= minSkillsPercentage;
  const projectsReady = completedProjects.length >= minProjects;
  const isReady = skillsReady && projectsReady;

  const missingSkills = skills.filter(s => !s.completed);
  const missingProjectsCount = Math.max(0, minProjects - completedProjects.length);

  const getStatusIcon = (ready: boolean) => {
    if (ready) return <CheckCircle size={24} color="#10b981" />;
    return <XCircle size={24} color="#ef4444" />;
  };

  const getStatusColor = (ready: boolean) => {
    return ready ? '#10b981' : '#ef4444';
  };

  return (
    <div className="card">
      <div className="card-header">
        <TrendingUp size={32} color="#667eea" />
        <div>
          <h2 className="card-title">Internship Readiness Checker</h2>
          <p className="card-description">Are you ready to apply?</p>
        </div>
      </div>

      <div style={{
        background: isReady
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'lightblack',
        padding: '32px',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '32px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
          {isReady ? '✅' : '⏳'}
        </div>
        <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
          {isReady ? 'You\'re Ready!' : 'Not Ready Yet'}
        </h3>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>
          {isReady 
            ? 'You have the skills and experience to start applying for internships!'
            : 'Complete the requirements below to become internship-ready'}
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          Readiness Checklist
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' ,color: isReady ? '#000000' : '#333333'}}>
          <div style={{
            border: `2px solid ${getStatusColor(skillsReady)}`,
            borderRadius: '12px',
            padding: '20px',
            background: skillsReady ? '#f0fdf4' : 'white'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getStatusIcon(skillsReady)}
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>
                    Core Skills Completed
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                    At least {minSkillsPercentage}% of roadmap skills required
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: getStatusColor(skillsReady)
              }}>
                {skillsPercentage}%
              </div>
            </div>
            
            <div className="progress-bar">
              <div 
                style={{ 
                  height: '100%',
                  width: `${skillsPercentage}%`,
                  background: getStatusColor(skillsReady),
                  borderRadius: '10px'
                }}
              />
            </div>
            
            <div style={{ 
              marginTop: '12px',
              fontSize: '14px',
              color: '#666'
            }}>
              {completedSkills} of {totalSkills} skills completed
            </div>
          </div>

          <div style={{
            border: `2px solid ${getStatusColor(projectsReady)}`,
            borderRadius: '12px',
            padding: '20px',
            background: projectsReady ? '#f0fdf4' : 'white'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getStatusIcon(projectsReady)}
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>
                    Practical Projects Completed
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                    At least {minProjects} projects required
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: getStatusColor(projectsReady)
              }}>
                {completedProjects.length}/{minProjects}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isReady && (
        <div style={{
          background: '#fff7ed',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <AlertCircle size={24} color="#f59e0b" />
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#92400e' }}>
              What You Need to Do
            </h4>
          </div>

          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            color: '#92400e'
          }}>
            {!skillsReady && (
              <li style={{ marginBottom: '8px' }}>
                Complete {Math.ceil((minSkillsPercentage - skillsPercentage) / 100 * totalSkills)} more skills 
                ({minSkillsPercentage - skillsPercentage}% remaining)
              </li>
            )}
            {!projectsReady && (
              <li style={{ marginBottom: '8px' }}>
                Complete {missingProjectsCount} more {missingProjectsCount === 1 ? 'project' : 'projects'}
              </li>
            )}
          </ul>

          {!skillsReady && missingSkills.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>
                Missing Skills:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {missingSkills.slice(0, 10).map(skill => (
                  <span key={skill.id} className="badge badge-warning">
                    {skill.name}
                  </span>
                ))}
                {missingSkills.length > 10 && (
                  <span className="badge badge-warning">
                    +{missingSkills.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isReady && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
            🚀 Next Steps
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.95 }}>
            <li style={{ marginBottom: '8px' }}>
              Review the Internships tab for matched opportunities
            </li>
            <li style={{ marginBottom: '8px' }}>
              Update your resume with completed projects
            </li>
            <li style={{ marginBottom: '8px' }}>
              Prepare for technical interviews
            </li>
            <li>
              Start applying to internships with 80%+ match
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReadinessChecker;