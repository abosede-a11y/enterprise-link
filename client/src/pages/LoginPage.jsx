import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.token, res.data.user);
      toast.success('Welcome back!');
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">EnterpriseLink</div>
        <p className="auth-subtitle">Sign in to your business account</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className={`form-input${errors.email ? ' error' : ''}`}
              type="email" placeholder="you@business.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className={`form-input${errors.password ? ' error' : ''}`}
              type="password" placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <Link to="/forgot-password" className="text-sm">Forgot password?</Link>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-center text-sm text-muted">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
        <p className="text-center text-sm text-muted mt-4">
          Admin? <Link to="/admin/register">Request admin access</Link>
        </p>
      </div>
    </div>
  );
}
