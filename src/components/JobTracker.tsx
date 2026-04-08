import React, { useState, useEffect } from 'react';
import type { Skill, Job, JobApplication, JobWithMatch } from '../types';
import { getJobs, getJobApplications, upsertJobApplication, deleteJobApplication } from '../lib/api';
import {
  Briefcase, MapPin, DollarSign, Clock, TrendingUp,
  ExternalLink, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Loader, Users
} from 'lucide-react';
import '../css/JobTracker.css';

interface Props {
  skills: Skill[];
  careerPath: string;
}

const JobTracker: React.FC<Props> = ({ skills, careerPath }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'applied'>('all');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [savingApplication, setSavingApplication] = useState<string | null>(null);

  // Load jobs and applications
  useEffect(() => {
    if (!careerPath) return;

    setLoading(true);
    Promise.all([
      getJobs(careerPath),
      getJobApplications()
    ])
      .then(([jobsData, appsData]) => {
        setJobs(jobsData);
        setApplications(appsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [careerPath]);

  // Calculate match data for each job
  const jobsWithMatch: JobWithMatch[] = jobs.map(job => {
    // Filter to only valid skills that exist in our skills array
    const validRequiredSkills = job.requiredSkills.filter(id => skills.find(s => s.id === id));

    // If job has no valid skills at all, skip it (shouldn't happen due to filtering in API)
    if (validRequiredSkills.length === 0) {
      console.warn(`Job "${job.title}" has no valid skill mappings, using fallback`);
    }

    const completedSkillIds = skills.filter(s => s.completed).map(s => s.id);
    const matchedCount = validRequiredSkills.filter(id => completedSkillIds.includes(id)).length;
    const matchPercentage = validRequiredSkills.length > 0
      ? Math.round((matchedCount / validRequiredSkills.length) * 100)
      : 0; // Changed from 100 to 0 for jobs with no valid skills

    // Categorize
    let category: 'ready' | 'almost' | 'future';
    if (matchPercentage >= 80) category = 'ready';
    else if (matchPercentage >= 60) category = 'almost';
    else category = 'future';

    // Find missing skills (only from valid skills)
    const missingSkillIds = validRequiredSkills.filter(id => !completedSkillIds.includes(id));
    const missingSkills = skills.filter(s => missingSkillIds.includes(s.id));

    // Find application if exists
    const application = applications.find(app => app.jobId === job.id);

    return {
      job,
      matchPercentage,
      matchedSkillsCount: matchedCount,
      totalSkillsCount: validRequiredSkills.length,
      missingSkills,
      matchCategory: category,
      application,
    };
  });

  // Filter by category
  const filteredJobs = selectedCategory === 'all'
    ? jobsWithMatch
    : jobsWithMatch.filter(j => j.application !== undefined);

  // Sort: ready first, then by match percentage, then by date
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const categoryOrder = { ready: 0, almost: 1, future: 2 };
    if (a.matchCategory !== b.matchCategory) {
      return categoryOrder[a.matchCategory] - categoryOrder[b.matchCategory];
    }
    if (a.matchPercentage !== b.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return new Date(b.job.postedDate).getTime() - new Date(a.job.postedDate).getTime();
  });

  // Count applied jobs
  const appliedJobs = jobsWithMatch.filter(j => j.application !== undefined);

  // Calculate salary insights
  const calculateSalaryInsights = () => {
    const jobsWithSalary = jobsWithMatch.filter(j => j.job.salaryMax);
    if (jobsWithSalary.length < 5) return null;

    // Get all unique skills from jobs
    type SkillImpact = { id: string; name: string; impact: number };
    const skillImpacts: Map<string, { with: number[]; without: number[] }> = new Map();

    skills.forEach(skill => {
      const jobsWith = jobsWithSalary.filter(j => j.job.requiredSkills.includes(skill.id) && j.job.salaryMax);
      const jobsWithout = jobsWithSalary.filter(j => !j.job.requiredSkills.includes(skill.id) && j.job.salaryMax);

      if (jobsWith.length >= 2 && jobsWithout.length >= 2) {
        skillImpacts.set(skill.id, {
          with: jobsWith.map(j => j.job.salaryMax!),
          without: jobsWithout.map(j => j.job.salaryMax!)
        });
      }
    });

    const impacts: SkillImpact[] = [];
    skillImpacts.forEach((value, skillId) => {
      const avgWith = value.with.reduce((a, b) => a + b, 0) / value.with.length;
      const avgWithout = value.without.reduce((a, b) => a + b, 0) / value.without.length;
      const impact = avgWith - avgWithout;

      if (impact > 0) {
        const skill = skills.find(s => s.id === skillId);
        if (skill) {
          impacts.push({ id: skillId, name: skill.name, impact });
        }
      }
    });

    return impacts.sort((a, b) => b.impact - a.impact).slice(0, 3);
  };

  const salaryInsights = calculateSalaryInsights();

  // Handle application status change
  const handleApplicationUpdate = async (
    jobId: string,
    status: 'applied' | 'interviewing' | 'offer' | 'rejected' | null
  ) => {
    setSavingApplication(jobId);
    try {
      if (status === null) {
        await deleteJobApplication(jobId);
        setApplications(prev => prev.filter(app => app.jobId !== jobId));
      } else {
        const updated = await upsertJobApplication(jobId, status);
        setApplications(prev => {
          const existing = prev.find(app => app.jobId === jobId);
          if (existing) {
            return prev.map(app => app.jobId === jobId ? updated : app);
          }
          return [...prev, updated];
        });
      }
    } catch (err) {
      console.error('Failed to update application:', err);
    } finally {
      setSavingApplication(null);
    }
  };

  // Format salary range
  const formatSalaryRange = (min?: number, max?: number, currency = 'INR'): string => {
    if (!min && !max) return 'Salary not specified';

    const format = (val: number) => {
      if (currency === 'INR') {
        // Format for Indian currency (Lakhs)
        if (val >= 100000) {
          const lakhs = val / 100000;
          return lakhs % 1 === 0 ? `${lakhs}L` : `${lakhs.toFixed(1)}L`;
        }
        return `${Math.round(val / 1000)}k`;
      } else {
        // Format for USD/other currencies
        if (val >= 1000) return `${Math.round(val / 1000)}k`;
        return val.toString();
      }
    };

    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;

    if (min && max) return `${symbol}${format(min)} - ${symbol}${format(max)}`;
    if (max) return `Up to ${symbol}${format(max)}`;
    if (min) return `From ${symbol}${format(min)}`;
    return 'Salary not specified';
  };

  // Format posted date
  const formatPostedDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get location icon
  const getLocationIcon = (type: 'remote' | 'onsite' | 'hybrid'): string => {
    if (type === 'remote') return 'Remote 🏠';
    if (type === 'hybrid') return 'Hybrid 🏢🏠';
    return 'Onsite 🏢';
  };

  return (
    <div className="card jt-container">
      {/* Header Section */}
      <div className="card-header">
        <Briefcase size={32} color="#667eea" />
        <div>
          <h2 className="card-title">Live Job Tracker</h2>
          <p className="card-description">
            Smart-matched opportunities for {careerPath} • {jobs.length} jobs available
          </p>
        </div>
      </div>

      {/* Salary Insights Banner */}
      {salaryInsights && salaryInsights.length > 0 && (
        <div className="jt-insights-banner">
          <TrendingUp size={24} color="#667eea" />
          <div className="jt-insights-content">
            <div className="jt-insights-title">Top Skill Impact on Salary</div>
            <div className="jt-insights-items">
              {salaryInsights.map(skill => (
                <span key={skill.id} className="jt-skill-impact">
                  {skill.name}: +₹{Math.round(skill.impact / 100000)}L avg
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="jt-category-tabs">
        <button
          className={selectedCategory === 'all' ? 'jt-tab jt-tab--active' : 'jt-tab'}
          onClick={() => setSelectedCategory('all')}
        >
          All Jobs ({jobsWithMatch.length})
        </button>
        <button
          className={selectedCategory === 'applied' ? 'jt-tab jt-tab--active jt-tab--applied' : 'jt-tab'}
          onClick={() => setSelectedCategory('applied')}
        >
          <CheckCircle size={16} />
          Applied Jobs ({appliedJobs.length})
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="jt-loading">
          <Loader size={32} className="jt-spinner" />
          <p>Loading job opportunities...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedJobs.length === 0 && (
        <div className="jt-empty">
          <Briefcase size={48} style={{ opacity: 0.3 }} />
          <p>No jobs available for {careerPath} yet</p>
          <p style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
            Check back soon for new opportunities
          </p>
        </div>
      )}

      {/* Job Cards List */}
      {!loading && sortedJobs.length > 0 && (
        <div className="jt-jobs-list">
          {sortedJobs.map(jobMatch => {
            const { job, matchPercentage, matchCategory, missingSkills, application } = jobMatch;
            const expanded = expandedJob === job.id;
            const categoryColors = {
              ready: { border: '#10b981', bg: '#f0fdf4', badge: '#10b981' },
              almost: { border: '#f59e0b', bg: '#fffbeb', badge: '#f59e0b' },
              future: { border: '#667eea', bg: '#eef2ff', badge: '#667eea' },
            };
            const colors = categoryColors[matchCategory];

            return (
              <div
                key={job.id}
                className="jt-job-card"
                style={{ borderColor: colors.border, background: colors.bg }}
              >
                {/* Match Badge */}
                <div className="jt-match-badge" style={{ background: colors.badge }}>
                  {matchPercentage}% Match
                </div>

                {/* Job Header */}
                <div className="jt-job-header">
                  <div className="jt-job-main">
                    <h3 className="jt-job-title">{job.title}</h3>
                    <div className="jt-job-company">{job.company}</div>
                  </div>
                </div>

                {/* Job Meta Info */}
                <div className="jt-job-meta">
                  <div className="jt-meta-item">
                    <MapPin size={16} />
                    {getLocationIcon(job.type)} {job.location}
                  </div>
                  <div className="jt-meta-item">
                    <Clock size={16} />
                    {formatPostedDate(job.postedDate)}
                  </div>
                  {(job.salaryMin || job.salaryMax) && (
                    <div className="jt-meta-item jt-meta-salary">
                      <DollarSign size={16} />
                      {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                    </div>
                  )}
                  {job.companySize && (
                    <div className="jt-meta-item">
                      <Users size={16} />
                      {job.companySize}
                    </div>
                  )}
                </div>

                {/* Application Status */}
                {application && (
                  <div className={`jt-application-status jt-status--${application.status}`}>
                    <CheckCircle size={16} />
                    Status: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    <span className="jt-status-date">• {formatDate(application.appliedDate)}</span>
                  </div>
                )}

                {/* Skill Match Summary */}
                <div className="jt-skills-summary">
                  <div className="jt-skills-label">
                    Required Skills ({jobMatch.matchedSkillsCount}/{jobMatch.totalSkillsCount}):
                  </div>
                  <div className="jt-skills-badges">
                    {job.requiredSkills.length === 0 ? (
                      <span className="badge">General skills</span>
                    ) : (
                      <>
                        {job.requiredSkills.slice(0, 6).map(skillId => {
                          const skill = skills.find(s => s.id === skillId);
                          // Skip rendering if skill not found (prevents "Unknown" from showing)
                          if (!skill) return null;
                          const hasSkill = skill.completed;
                          return (
                            <span
                              key={skillId}
                              className={`badge ${hasSkill ? 'badge-success' : 'badge-warning'}`}
                            >
                              {skill.name} {hasSkill && '✓'}
                            </span>
                          );
                        }).filter(Boolean)}
                        {job.requiredSkills.length > 6 && (
                          <span className="badge">+{job.requiredSkills.length - 6} more</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expandable Section Toggle */}
                <button className="jt-expand-btn" onClick={() => setExpandedJob(expanded ? null : job.id)}>
                  {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  {expanded ? 'Hide Details' : 'View Details & Track Application'}
                </button>

                {/* Expanded Details */}
                {expanded && (
                  <div className="jt-job-details">
                    {/* Description */}
                    {job.description && (
                      <div className="jt-detail-section">
                        <h4>About the Role</h4>
                        <p>{job.description}</p>
                      </div>
                    )}

                    {/* Benefits */}
                    {job.benefits && job.benefits.length > 0 && (
                      <div className="jt-detail-section">
                        <h4>Benefits</h4>
                        <div className="jt-benefits-list">
                          {job.benefits.map((benefit, idx) => (
                            <span key={idx} className="badge badge-info">
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skill Gap Analysis */}
                    {missingSkills.length > 0 && (
                      <div className="jt-detail-section jt-skill-gap">
                        <h4>
                          <AlertCircle size={18} />
                          Skills to Develop ({missingSkills.length})
                        </h4>
                        <div className="jt-missing-skills-list">
                          {missingSkills.map(skill => (
                            <div key={skill.id} className="jt-missing-skill-item">
                              <div className="jt-missing-skill-name">{skill.name}</div>
                              <div className="jt-missing-skill-desc">{skill.description}</div>
                              {/* Could add navigation to resources here */}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Application Tracking */}
                    <div className="jt-detail-section jt-tracking-section">
                      <h4>Track Your Application</h4>
                      <div className="jt-status-buttons">
                        <button
                          className={`jt-status-btn ${application?.status === 'applied' ? 'jt-status-btn--active' : ''}`}
                          onClick={() => handleApplicationUpdate(job.id, 'applied')}
                          disabled={savingApplication === job.id}
                        >
                          Applied
                        </button>
                        <button
                          className={`jt-status-btn ${application?.status === 'interviewing' ? 'jt-status-btn--active' : ''}`}
                          onClick={() => handleApplicationUpdate(job.id, 'interviewing')}
                          disabled={savingApplication === job.id}
                        >
                          Interviewing
                        </button>
                        <button
                          className={`jt-status-btn ${application?.status === 'offer' ? 'jt-status-btn--active' : ''}`}
                          onClick={() => handleApplicationUpdate(job.id, 'offer')}
                          disabled={savingApplication === job.id}
                        >
                          Offer
                        </button>
                        <button
                          className={`jt-status-btn ${application?.status === 'rejected' ? 'jt-status-btn--active' : ''}`}
                          onClick={() => handleApplicationUpdate(job.id, 'rejected')}
                          disabled={savingApplication === job.id}
                        >
                          Rejected
                        </button>
                        {application && (
                          <button
                            className="jt-status-btn jt-status-btn--remove"
                            onClick={() => handleApplicationUpdate(job.id, null)}
                            disabled={savingApplication === job.id}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Apply Button */}
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn ${matchCategory === 'ready' ? 'btn-success' : 'btn-secondary'} jt-apply-btn`}
                    >
                      <ExternalLink size={18} />
                      {matchCategory === 'ready' ? 'Apply Now' : 'View Job Posting'}
                    </a>
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

export default JobTracker;
