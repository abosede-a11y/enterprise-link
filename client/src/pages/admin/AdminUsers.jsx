import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const navigate = useNavigate();

  const load = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?search=${q}`);
      setUsers(res.data.users);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const viewUser = async (id) => {
    try {
      const res = await api.get(`/admin/users/${id}`);
      setSelected(res.data);
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <p>All registered MSME businesses.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Users ({users.length})</span>
          <input className="form-input" style={{ width: 250 }} placeholder="🔍 Search by name or email..."
            value={search} onChange={(e) => { setSearch(e.target.value); load(e.target.value); }} />
        </div>
        <div className="table-wrap">
          {loading ? <div className="empty-state"><div className="spinner spinner-dark" /></div> :
            users.length ? (
              <table>
                <thead>
                  <tr><th>Business</th><th>Email</th><th>Phone</th><th>Onboarding</th><th>Verified</th><th>Joined</th><th></th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.business_name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        <span className={`badge ${u.onboarding_status === 'completed' ? 'badge-success' : u.onboarding_status === 'in_progress' ? 'badge-warning' : 'badge-gray'}`}>
                          {u.onboarding_status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{u.is_verified ? '✅' : '—'}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td><button className="btn btn-secondary btn-sm" onClick={() => viewUser(u.id)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><div className="empty-state-icon">👥</div><h3>No users found</h3></div>
            )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div className="card" style={{ width: 600, maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <div>
                <div className="card-title">{selected.user.business_name}</div>
                <div className="text-sm text-muted">{selected.user.email}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="card-body" style={{ overflowY: 'auto' }}>
              {/* Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  ['Phone', selected.user.phone || '—'],
                  ['Tax ID', selected.user.tax_id || '—'],
                  ['Onboarding', selected.user.onboarding_status],
                  ['Transactions', selected.transaction_count],
                  ['Verified', selected.user.is_verified ? 'Yes ✅' : 'No'],
                  ['Joined', new Date(selected.user.created_at).toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 8 }}>
                    <div className="text-sm text-muted">{k}</div>
                    <div style={{ fontWeight: 600, marginTop: 2, textTransform: 'capitalize' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Documents */}
              <div style={{ fontWeight: 600, marginBottom: 10 }}>📋 Documents</div>
              {selected.documents.length ? selected.documents.map((d) => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span className="text-sm">{d.document_type.replace(/_/g, ' ')}</span>
                  <span className={`badge ${d.status === 'approved' ? 'badge-success' : d.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{d.status}</span>
                </div>
              )) : <p className="text-sm text-muted">No documents uploaded.</p>}

              {/* Tickets */}
              <div style={{ fontWeight: 600, margin: '16px 0 10px' }}>🎧 Recent Tickets</div>
              {selected.tickets.length ? selected.tickets.slice(0, 3).map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span className="text-sm">{t.subject}</span>
                  <span className={`badge ${t.status === 'resolved' ? 'badge-success' : t.status === 'in_progress' ? 'badge-warning' : 'badge-blue'}`}>{t.status}</span>
                </div>
              )) : <p className="text-sm text-muted">No tickets.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
