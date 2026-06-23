import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    business_name: '', email: '', phone: '', password: '', confirm: ''
  });

  const openModal = (tab = 'login') => {
    setActiveTab(tab);
    setModalOpen(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error('Email and password are required.'); return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', loginForm);
      login(res.data.token, res.data.user);
      toast.success('Welcome back!');
      setModalOpen(false);
      if (res.data.user.is_admin || res.data.user.is_super_admin) {
        localStorage.setItem('el_admin_token', res.data.token);
        localStorage.setItem('el_admin_user', JSON.stringify(res.data.user));
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.business_name || !registerForm.email || !registerForm.password) {
      toast.error('Please fill in all required fields.'); return;
    }
    if (registerForm.password.length < 8) {
      toast.error('Password must be at least 8 characters.'); return;
    }
    if (registerForm.password !== registerForm.confirm) {
      toast.error('Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        business_name: registerForm.business_name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      });
      login(res.data.token, res.data.user);
      toast.success('Account created! Welcome to Enterprise Link.');
      setModalOpen(false);
      navigate('/onboarding');
    } catch {}
    finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    marginTop: 4,
  };
  const labelStyle = { display: 'block', fontSize: 13, color: '#374151', marginBottom: 2, fontWeight: 500 };
  const groupStyle = { marginBottom: 14 };

  const FEATURES = [
    { icon: '📋', title: 'Business onboarding', desc: 'Upload documents and get verified in 2–3 business days.' },
    { icon: '💳', title: 'Transaction history', desc: 'Track, filter, and export your full payment records.' },
    { icon: '🎧', title: 'Support tickets', desc: 'Raise requests and track resolutions from your dashboard.' },
    { icon: '❓', title: 'FAQ centre', desc: 'Find answers instantly — bookmark the ones you need most.' },
    { icon: '👤', title: 'Business profile', desc: 'Keep your business details accurate and up to date.' },
    { icon: '🔒', title: 'Secure access', desc: 'JWT-secured login with password reset and session control.' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#111827', background: '#fff', minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid #f3f4f6', background: '#fff', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          <span style={{ color: '#1d4ed8' }}>Enterprise</span>Link
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="#features" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none' }}>Features</a>
          <a href="#about" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none' }}>About</a>
          <button onClick={() => openModal('login')} style={{ fontSize: 14, padding: '8px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'transparent', color: '#111827', cursor: 'pointer' }}>
            Sign in
          </button>
          <button onClick={() => openModal('register')} style={{ fontSize: 14, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '5rem 2rem 4rem', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 14px', borderRadius: 99, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', marginBottom: '1.5rem', fontWeight: 500 }}>
          ✦ Trusted by MSMEs across United Kingdom
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.15, marginBottom: '1rem' }}>
          Financial services built for{' '}
          <span style={{ color: '#1d4ed8' }}>growing businesses</span>
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.7, marginBottom: '2rem' }}>
          Enterprise Link helps small and medium businesses access financial tools, manage transactions, and get verified — all in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => openModal('register')} style={{ fontSize: 15, padding: '12px 28px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Create free account
          </button>
          <button onClick={() => openModal('login')} style={{ fontSize: 15, padding: '12px 28px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'transparent', color: '#374151', cursor: 'pointer' }}>
            Sign in →
          </button>
        </div>
      </section>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
        {[['500+', 'Businesses onboarded'], ['₦2B+', 'Transactions processed'], ['24h', 'Support response time']].map(([num, label], i) => (
          <div key={i} style={{ padding: '2rem 1rem', textAlign: 'center', borderRight: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1d4ed8' }}>{num}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section id="features" style={{ padding: '4rem 2rem', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Platform features</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Everything your business needs</h2>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: '2.5rem' }}>From onboarding to transactions — manage it all from one dashboard.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="about" style={{ padding: '4rem 2rem', textAlign: 'center', background: '#f9fafb', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Ready to get started?</h2>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: '2rem' }}>Join hundreds of businesses already using Enterprise Link to manage their finances.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => openModal('register')} style={{ fontSize: 15, padding: '12px 28px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Create account
          </button>
          <button onClick={() => openModal('login')} style={{ fontSize: 15, padding: '12px 28px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer' }}>
            Sign in
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}><span style={{ color: '#1d4ed8' }}>Enterprise</span>Link</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map((l) => (
            <a key={l} href="#" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>© 2026 EnterpriseLink. All rights reserved.</div>
      </footer>

      {/* Modal */}
      {modalOpen && (
        <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {activeTab === 'login' ? 'Sign in' : 'Create account'}
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: '1.5rem' }}>
              {['login', 'register'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: 9, fontSize: 13, border: 'none', cursor: 'pointer', background: activeTab === tab ? '#1d4ed8' : 'transparent', color: activeTab === tab ? '#fff' : '#6b7280', fontWeight: activeTab === tab ? 600 : 400 }}>
                  {tab === 'login' ? 'Sign in' : 'Register'}
                </button>
              ))}
            </div>

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={groupStyle}>
                  <label style={labelStyle}>Email address</label>
                  <input type="email" placeholder="you@business.com" style={inputStyle}
                    value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Password</label>
                  <input type="password" placeholder="••••••••" style={inputStyle}
                    value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
                <div style={{ textAlign: 'right', marginBottom: 16 }}>
                  <span onClick={() => { setModalOpen(false); navigate('/forgot-password'); }} style={{ fontSize: 12, color: '#1d4ed8', cursor: 'pointer' }}>Forgot password?</span>
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: 11, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
                  Admin? <span onClick={() => { setModalOpen(false); navigate('/admin/register'); }} style={{ color: '#1d4ed8', cursor: 'pointer' }}>Request admin access</span>
                </div>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister}>
                <div style={groupStyle}>
                  <label style={labelStyle}>Business name *</label>
                  <input type="text" placeholder="Acme Ltd." style={inputStyle}
                    value={registerForm.business_name} onChange={(e) => setRegisterForm({ ...registerForm, business_name: e.target.value })} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Email address *</label>
                  <input type="email" placeholder="you@business.com" style={inputStyle}
                    value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Phone number</label>
                  <input type="tel" placeholder="+234 800 000 0000" style={inputStyle}
                    value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Password *</label>
                  <input type="password" placeholder="Min. 8 characters" style={inputStyle}
                    value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Confirm password *</label>
                  <input type="password" placeholder="Repeat password" style={inputStyle}
                    value={registerForm.confirm} onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: 11, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
                <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
                  Already have an account? <span onClick={() => setActiveTab('login')} style={{ color: '#1d4ed8', cursor: 'pointer' }}>Sign in</span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
