import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminPendingRequests() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pending-admins');
      setPending(res.data.pending_admins);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/admin/pending-admins/${id}`, { action });
      toast.success(`Request ${action}d successfully.`);
      load();
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <h1>Pending Admin Requests</h1>
        <p>Review and approve or reject admin registration requests.</p>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark" /></div>
      ) : pending.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pending.map((user) => (
            <div key={user.id} className="card">
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user.business_name}</div>
                  <div className="text-sm text-muted">{user.email}</div>
                  {user.phone && <div className="text-sm text-muted">{user.phone}</div>}
                  <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                    Requested {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-success btn-sm" onClick={() => handleAction(user.id, 'approve')}>
                    ✅ Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleAction(user.id, 'reject')}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state" style={{ padding: 60 }}>
            <div className="empty-state-icon">🛡️</div>
            <h3>No pending requests</h3>
            <p>All admin requests have been reviewed.</p>
          </div>
        </div>
      )}
    </div>
  );
}
