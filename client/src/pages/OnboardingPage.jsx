import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DOCS = [
  { key: 'business_registration', label: 'Business Registration Certificate', hint: 'CAC certificate or equivalent' },
  { key: 'proof_of_address', label: 'Proof of Address', hint: 'Utility bill or bank statement (last 3 months)' },
  { key: 'tax_identification', label: 'Tax Identification Number (TIN)', hint: 'FIRS-issued TIN document' },
];

const STEP_ICON = { approved: '✅', submitted: '⏳', pending: '○', rejected: '✗' };
const STEP_LABEL = { approved: 'Approved', submitted: 'Under Review', pending: 'Not Uploaded', rejected: 'Rejected' };

export default function OnboardingPage() {
  const [progress, setProgress] = useState(null);
  const [uploading, setUploading] = useState({});

  const load = async () => {
    try {
      const res = await api.get('/onboarding/progress');
      setProgress(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (docType, file) => {
    if (!file) return;
    setUploading((u) => ({ ...u, [docType]: true }));
    const form = new FormData();
    form.append('document', file);
    form.append('document_type', docType);
    try {
      await api.post('/onboarding/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded successfully.');
      load();
    } catch {}
    finally { setUploading((u) => ({ ...u, [docType]: false })); }
  };

  const stepData = progress?.steps || [];
  const overall = progress?.onboarding_status || 'pending';
  const pct = progress?.progress?.percentage || 0;

  return (
    <div>
      <div className="page-header">
        <h1>Onboarding</h1>
        <p>Upload your business documents to complete verification and unlock full access.</p>
      </div>

      {/* Overall status */}
      <div className="card mb-4">
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Overall Progress</div>
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                {progress?.progress?.completed || 0} of {progress?.progress?.total || 3} documents approved
              </div>
            </div>
            <span className={`badge ${overall === 'completed' ? 'badge-success' : overall === 'in_progress' ? 'badge-warning' : 'badge-gray'}`}>
              {overall.replace('_', ' ')}
            </span>
          </div>
          <div style={{ background: 'var(--gray-200)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, background: 'var(--primary)', height: '100%', borderRadius: 99, transition: 'width .5s ease' }} />
          </div>
          <div className="text-sm text-muted" style={{ marginTop: 6 }}>{pct}% complete</div>
        </div>
      </div>

      {/* Steps */}
      <div className="card">
        <div className="card-header"><span className="card-title">Document Checklist</span></div>
        <div className="card-body">
          <div className="step-list">
            {DOCS.map((doc, i) => {
              const step = stepData.find((s) => s.key === doc.key) || { key: doc.key, status: 'pending' };
              return (
                <div key={doc.key} className="step-item">
                  <div className={`step-icon ${step.status}`}>{STEP_ICON[step.status]}</div>
                  <div className="step-body">
                    <div className="step-title">{doc.label}</div>
                    <div className="step-desc">{doc.hint}</div>
                    {step.file_name && (
                      <div className="text-sm" style={{ marginTop: 4, color: 'var(--gray-500)' }}>
                        📄 {step.file_name}
                        {step.submitted_at && ` · Submitted ${new Date(step.submitted_at).toLocaleDateString()}`}
                      </div>
                    )}
                    {step.rejection_reason && (
                      <div style={{ marginTop: 6, color: 'var(--danger)', fontSize: '0.8rem', background: 'var(--danger-light)', padding: '6px 10px', borderRadius: 'var(--radius)' }}>
                        Rejected: {step.rejection_reason}
                      </div>
                    )}
                    <div style={{ marginTop: 10 }}>
                      <span className={`badge ${
                        step.status === 'approved' ? 'badge-success' :
                        step.status === 'submitted' ? 'badge-warning' :
                        step.status === 'rejected' ? 'badge-danger' : 'badge-gray'
                      }`}>{STEP_LABEL[step.status]}</span>
                    </div>

                    {step.status !== 'approved' && (
                      <div style={{ marginTop: 14 }}>
                        <label className="upload-zone" style={{ display: 'block', cursor: uploading[doc.key] ? 'wait' : 'pointer' }}>
                          <input type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleUpload(doc.key, e.target.files[0])} disabled={uploading[doc.key]} />
                          {uploading[doc.key] ? (
                            <><div className="spinner spinner-dark" /><p>Uploading...</p></>
                          ) : (
                            <><div style={{ fontSize: '1.5rem' }}>⬆️</div><p>Click to upload PDF, JPG, or PNG (max 5MB)</p></>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {overall === 'completed' && (
        <div style={{ marginTop: 20, background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: '2rem' }}>🎉</span>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--success)' }}>Onboarding Complete!</div>
            <div className="text-sm" style={{ color: 'var(--success)' }}>All documents have been verified. You have full access to Enterprise Link services.</div>
          </div>
        </div>
      )}
    </div>
  );
}
