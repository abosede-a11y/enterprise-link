import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      if (!res.data.user.is_admin) {
        toast.error('You do not have admin access.');
        return;
      }
      localStorage.setItem('el_admin_token', res.data.token);
      localStorage.setItem('el_admin_user', JSON.stringify(res.data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      toast.success('Welcome, Admin!');
      navigate('/admin/dashboard');
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1d4ed8 100%)' }}>
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛡️</div>
          <div className="auth-logo">Admin Portal</div>
          <p className="auth-subtitle">Enterprise Link Administration</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input className={`form-input${errors.email ? ' error' : ''}`} type="email" placeholder="admin@enterpriselink.com"
              {...register('email', { required: 'Email is required' })} />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className={`form-input${errors.password ? ' error' : ''}`} type="password" placeholder="••••••••"
              {...register('password', { required: 'Password is required' })} />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In to Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
