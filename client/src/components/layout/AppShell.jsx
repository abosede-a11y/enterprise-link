import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/onboarding', label: 'Onboarding', icon: '📋' },
  { to: '/support', label: 'Support', icon: '🎧' },
  { to: '/faq', label: 'FAQ', icon: '❓' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/onboarding': 'Onboarding',
  '/support': 'Support',
  '/faq': 'Frequently Asked Questions',
  '/profile': 'Business Profile',
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const initials = user?.business_name
    ?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'U';

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">Enterprise<span>Link</span></div>
        <nav className="sidebar-nav">
          <div className="nav-label">Menu</div>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span>{icon}</span> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-link btn-full" style={{ border: 'none', background: 'none', width: '100%' }} onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{PAGE_TITLES[pathname] || 'Enterprise Link'}</span>
          <div className="topbar-right">
            <span className="text-sm text-muted">{user?.business_name}</span>
            <div className="avatar" onClick={() => navigate('/profile')} title="Profile">
              {initials}
            </div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
