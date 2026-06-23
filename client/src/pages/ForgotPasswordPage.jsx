import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">EnterpriseLink</div>
        <p className="auth-subtitle">Reset your password</p>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem' }}>📧</div>
            <p style={{ marginTop: 12 }}>A reset link has been sent. It expires in 1 hour.</p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Back to Sign In</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">Registered Email Address</label>
              <input className={`form-input${errors.email ? ' error' : ''}`} type="email" placeholder="you@business.com"
                {...register('email', { required: 'Email is required' })} />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm text-muted mt-4"><Link to="/login">← Back to Sign In</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
