import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/pending-requests', label: 'Admin Requests', icon: '🛡️' },
  { to: '/admin/onboarding', label: 'Onboarding', icon: '📋' },
  { to: '/admin/transactions', label: 'Transactions', icon: '💳' },
  { to: '/admin/tickets', label: 'Support Tickets', icon: '🎧' },
  { to: '/admin/faqs', label: 'FAQs', icon: '❓' },
];

const PAGE_TITLES = {
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'Users',
  '/admin/onboarding': 'Onboarding Reviews',
  '/admin/transactions': 'Transactions',
  '/admin/tickets': 'Support Tickets',
  '/admin/faqs': 'FAQ Management',
};

export default function AdminShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('el_admin_token');
    const user = localStorage.getItem('el_admin_user');
    if (!token || !user) { navigate('/admin/login'); return; }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAdminUser(JSON.parse(user));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('el_admin_token');
    localStorage.removeItem('el_admin_user');
    delete api.defaults.headers.common['Authorization'];
    navigate('/admin/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" style={{ background: '#1e1b4b' }}>
        <div className="sidebar-logo" style={{ color: '#a5b4fc', borderBottomColor: '#312e81' }}>
          🛡️ <span style={{ color: '#fff' }}>Admin</span>Portal
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label" style={{ color: '#6366f1' }}>Administration</div>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={({ isActive }) => ({
                color: isActive ? '#fff' : '#a5b4fc',
                background: isActive ? '#4338ca' : 'transparent',
              })}
            >
              <span>{icon}</span> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer" style={{ borderTopColor: '#312e81' }}>
          <div style={{ fontSize: '0.8rem', color: '#a5b4fc', marginBottom: 8 }}>{adminUser?.email}</div>
          <button className="nav-link" style={{ border: 'none', background: 'none', color: '#a5b4fc', width: '100%' }} onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar" style={{ background: '#1e1b4b', borderBottomColor: '#312e81' }}>
          <span className="topbar-title" style={{ color: '#fff' }}>{PAGE_TITLES[pathname] || 'Admin'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-blue">Admin</span>
            <div className="avatar" style={{ background: '#4338ca' }}>A</div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
