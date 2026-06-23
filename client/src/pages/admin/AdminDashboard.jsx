import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of all platform activity.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/admin/users')}>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats?.users.total ?? '—'}</div>
          <div className="stat-sub">{stats?.users.verified ?? 0} verified</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)', cursor: 'pointer' }} onClick={() => navigate('/admin/onboarding')}>
          <div className="stat-label">Pending Documents</div>
          <div className="stat-value">{stats?.pending_documents ?? '—'}</div>
          <div className="stat-sub">Awaiting review</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)', cursor: 'pointer' }} onClick={() => navigate('/admin/tickets')}>
          <div className="stat-label">Open Tickets</div>
          <div className="stat-value">{stats?.open_tickets ?? '—'}</div>
          <div className="stat-sub">Need response</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)', cursor: 'pointer' }} onClick={() => navigate('/admin/transactions')}>
          <div className="stat-label">Completed Transactions</div>
          <div className="stat-value">{stats?.transactions.count ?? '—'}</div>
          <div className="stat-sub">NGN {parseFloat(stats?.transactions.total_amount || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16, marginTop: 8 }}>
        {[
          { label: 'Review Documents', desc: `${stats?.pending_documents || 0} pending`, to: '/admin/onboarding', icon: '📋', color: 'var(--warning)' },
          { label: 'Manage Tickets', desc: `${stats?.open_tickets || 0} open`, to: '/admin/tickets', icon: '🎧', color: 'var(--danger)' },
          { label: 'Manage FAQs', desc: 'Add or edit questions', to: '/admin/faqs', icon: '❓', color: 'var(--primary)' },
          { label: 'View Users', desc: `${stats?.users.total || 0} registered`, to: '/admin/users', icon: '👥', color: 'var(--success)' },
        ].map(({ label, desc, to, icon, color }) => (
          <div key={to} className="card" style={{ cursor: 'pointer', borderLeft: `4px solid ${color}` }}
            onClick={() => navigate(to)}>
            <div className="card-body" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: '2rem' }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{label}</div>
                <div className="text-sm text-muted">{desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
