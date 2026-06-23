import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminOnboarding() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('submitted');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  const load = async (status = filter) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/onboarding?status=${status}`);
      setDocs(res.data.documents);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(filter); }, [filter]);

  const handleAction = async (docId, action, rejection_reason) => {
    try {
      const res = await api.put(`/admin/onboarding/${docId}`, { action, rejection_reason });
      toast.success(action === 'approve' ? '✅ Document approved!' : '❌ Document rejected.');
      if (res.data.all_approved) toast.success('🎉 User onboarding completed!');
      setRejecting(null);
      setReason('');
      load(filter);
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <h1>Onboarding Reviews</h1>
        <p>Review and approve or reject submitted business documents.</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['submitted', 'approved', 'rejected'].map((s) => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <div className="empty-state"><div className="spinner spinner-dark" /></div> :
        docs.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {docs.map((doc) => (
              <div key={doc.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{doc.business_name}</div>
                      <div className="text-sm text-muted">{doc.email}</div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
                          {doc.document_type.replace(/_/g, ' ')}
                        </span>
                        <span className={`badge ${doc.status === 'approved' ? 'badge-success' : doc.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                          {doc.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted" style={{ marginTop: 6 }}>
                        📄 {doc.file_name} · Submitted {new Date(doc.submitted_at).toLocaleDateString()}
                      </div>
                      {doc.rejection_reason && (
                        <div style={{ marginTop: 8, color: 'var(--danger)', fontSize: '0.8rem', background: 'var(--danger-light)', padding: '6px 10px', borderRadius: 6 }}>
                          Rejection reason: {doc.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                      <a href={doc.file_url.startsWith('http') ? doc.file_url : `https://enterprise-link-api.onrender.com${doc.file_url}`} 
                        target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">👁 View File</a>

                      {doc.status === 'submitted' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleAction(doc.id, 'approve')}>
                            ✅ Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setRejecting(doc.id)}>
                            ❌ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason input */}
                  {rejecting === doc.id && (
                    <div style={{ marginTop: 16, padding: 16, background: 'var(--danger-light)', borderRadius: 8 }}>
                      <label className="form-label">Rejection Reason *</label>
                      <textarea className="form-textarea" rows={2} placeholder="Explain why the document is being rejected..."
                        value={reason} onChange={(e) => setReason(e.target.value)} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(doc.id, 'reject', reason)} disabled={!reason.trim()}>
                          Confirm Rejection
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setRejecting(null); setReason(''); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state card" style={{ padding: 60 }}>
            <div className="empty-state-icon">📋</div>
            <h3>No {filter} documents</h3>
            <p>All caught up!</p>
          </div>
        )}
    </div>
  );
}
