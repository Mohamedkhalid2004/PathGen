import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, ExternalLink, Loader } from 'lucide-react';
import type { Certification } from '../types';
import { getCertifications, addCertification, deleteCertification, logActivity } from '../lib/api';
import '../css/CertificationTracker.css';

interface Props {
  onCertificationsChange: (certs: Certification[]) => void;
}

const EMPTY_FORM = { name: '', issuer: '', issueDate: '', url: '' };

const CertificationTracker: React.FC<Props> = ({ onCertificationsChange }) => {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getCertifications()
      .then(data => {
        setCerts(data);
        onCertificationsChange(data);
      })
      .catch(() => setError('Failed to load certifications.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.issuer.trim() || !form.issueDate) return;
    setSaving(true);
    setError('');
    try {
      const added = await addCertification({
        name: form.name.trim(),
        issuer: form.issuer.trim(),
        issueDate: form.issueDate,
        url: form.url.trim() || undefined,
      });
      logActivity('certification_added');
      const updated = [added, ...certs];
      setCerts(updated);
      onCertificationsChange(updated);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      setError('Failed to save certification. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCertification(id);
      const updated = certs.filter(c => c.id !== id);
      setCerts(updated);
      onCertificationsChange(updated);
    } catch {
      setError('Failed to delete certification.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="card cert-card cert-loading">
        <Loader size={28} className="cert-spinner" color="#667eea" />
        <p>Loading certifications…</p>
      </div>
    );
  }

  return (
    <div className="cert-wrapper">
      <div className="card cert-header-card">
        <div className="card-header">
          <Award size={32} color="#667eea" />
          <div>
            <h2 className="card-title">Certification Tracker</h2>
            <p className="card-description">
              Log your earned certifications — they'll appear on your resume automatically
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary cert-add-btn"
          onClick={() => { setShowForm(f => !f); setError(''); }}
        >
          <Plus size={18} />
          {showForm ? 'Cancel' : 'Add Certification'}
        </button>
      </div>

      {showForm && (
        <div className="card cert-form-card">
          <h3 className="cert-form-title">New Certification</h3>
          {error && <div className="cert-error">{error}</div>}
          <form className="cert-form" onSubmit={handleAdd}>
            <div className="cert-form-row">
              <div className="cert-field">
                <label className="cert-label">Certification Name *</label>
                <input
                  className="cert-input"
                  type="text"
                  placeholder="e.g. AWS Certified Developer"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="cert-field">
                <label className="cert-label">Issuing Organization *</label>
                <input
                  className="cert-input"
                  type="text"
                  placeholder="e.g. Amazon Web Services"
                  value={form.issuer}
                  onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="cert-form-row">
              <div className="cert-field">
                <label className="cert-label">Issue Date *</label>
                <input
                  className="cert-input"
                  type="month"
                  value={form.issueDate}
                  onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                  required
                />
              </div>
              <div className="cert-field">
                <label className="cert-label">Certificate URL (optional)</label>
                <input
                  className="cert-input"
                  type="url"
                  placeholder="https://credential-link.com"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                />
              </div>
            </div>
            <button className="btn btn-primary cert-submit-btn" type="submit" disabled={saving}>
              {saving ? <><Loader size={15} className="cert-spinner-sm" /> Saving…</> : 'Save Certification'}
            </button>
          </form>
        </div>
      )}

      {!showForm && error && <div className="cert-error cert-error-global">{error}</div>}

      {certs.length === 0 ? (
        <div className="card cert-empty-card">
          <Award size={48} color="#d1d5db" />
          <p className="cert-empty-title">No certifications yet</p>
          <p className="cert-empty-sub">Add your AWS, Google, Coursera, or other credentials here</p>
        </div>
      ) : (
        <div className="cert-list">
          {certs.map(cert => (
            <div key={cert.id} className="card cert-item">
              <div className="cert-item-icon">
                <Award size={22} color="#667eea" />
              </div>
              <div className="cert-item-body">
                <div className="cert-item-name">{cert.name}</div>
                <div className="cert-item-meta">
                  <span className="cert-issuer">{cert.issuer}</span>
                  <span className="cert-dot">•</span>
                  <span className="cert-date">
                    {new Date(cert.issueDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="cert-item-actions">
                {cert.url && (
                  <a href={cert.url} target="_blank" rel="noopener noreferrer" className="cert-link-btn" title="View certificate">
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  className="cert-delete-btn"
                  onClick={() => handleDelete(cert.id)}
                  disabled={deletingId === cert.id}
                  title="Delete"
                >
                  {deletingId === cert.id ? <Loader size={16} className="cert-spinner-sm" /> : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificationTracker;
