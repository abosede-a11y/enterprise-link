import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_BADGE = {
  pending: 'badge-gray', in_progress: 'badge-warning', completed: 'badge-success',
  open: 'badge-blue', resolved: 'badge-success',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [txRes, tkRes, onRes] = await Promise.all([
          api.get('/transactions?limit=5'),
          api.get('/support/tickets?limit=1'),
          api.get('/onboarding/progress'),
        ]);
        setStats({
          transactions: txRes.data.pagination.total,
          recentTx: txRes.data.transactions.slice(0, 5),
          openTickets: tkRes.data.pagination.total,
          onboarding: onRes.data,
        });
      } catch {}
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="page-header">
        <h1>{greeting}, {user?.business_name?.split(' ')[0]} 👋</h1>
        <p>Here's a summary of your account activity.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value">{stats?.transactions ?? '—'}</div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Onboarding</div>
          <div className="stat-value">{stats?.onboarding?.progress?.percentage ?? 0}%</div>
          <div className="stat-sub">
            <span className={`badge ${STATUS_BADGE[stats?.onboarding?.onboarding_status] || 'badge-gray'}`}>
              {stats?.onboarding?.onboarding_status?.replace('_', ' ') || 'pending'}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Support Tickets</div>
          <div className="stat-value">{stats?.openTickets ?? '—'}</div>
          <div className="stat-sub">Total submitted</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Account Status</div>
          <div className="stat-value" style={{ fontSize: '1.1rem', paddingTop: 8 }}>
            <span className={`badge ${user?.is_verified ? 'badge-success' : 'badge-warning'}`}>
              {user?.is_verified ? '✅ Verified' : '⏳ Pending Verification'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Transactions</span>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/transactions')}>View All</button>
        </div>
        <div className="table-wrap">
          {stats?.recentTx?.length ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTx.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.reference_number}</td>
                    <td style={{ textTransform: 'capitalize' }}>{t.type}</td>
                    <td style={{ fontWeight: 600 }}>{t.currency} {parseFloat(t.amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        t.status === 'completed' ? 'badge-success' :
                        t.status === 'failed' ? 'badge-danger' :
                        t.status === 'pending' ? 'badge-gray' : 'badge-warning'
                      }`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <h3>No transactions yet</h3>
              <p>Your recent transactions will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginTop: 24 }}>
        {[
          { label: 'Complete Onboarding', desc: 'Upload your documents', to: '/onboarding', icon: '📋' },
          { label: 'Raise a Ticket', desc: 'Get help from support', to: '/support', icon: '🎧' },
          { label: 'Browse FAQs', desc: 'Find quick answers', to: '/faq', icon: '❓' },
        ].map(({ label, desc, to, icon }) => (
          <div key={to} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(to)}>
            <div className="card-body" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: '1.8rem' }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
