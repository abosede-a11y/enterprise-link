import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/register-admin', {
        business_name: data.business_name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      setSubmitted(true);
    } catch {}
    finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="auth-page" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1d4ed8 100%)' }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>⏳</div>
          <h2 style={{ marginBottom: 8 }}>Request Submitted!</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
            Your admin registration request has been submitted. A super-admin will review and approve your request. You will receive an email once approved.
          </p>
          <Link to="/login" className="btn btn-primary btn-full">Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1d4ed8 100%)' }}>
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛡️</div>
          <div className="auth-logo">Admin Registration</div>
          <p className="auth-subtitle">Request admin access to Enterprise Link</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Full Name / Organization</label>
            <input className={`form-input${errors.business_name ? ' error' : ''}`}
              placeholder="e.g. John Doe"
              {...register('business_name', { required: 'Name is required' })} />
            {errors.business_name && <p className="form-error">{errors.business_name.message}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className={`form-input${errors.email ? ' error' : ''}`}
                type="email" placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })} />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+234 800 000 0000"
                {...register('phone')} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className={`form-input${errors.password ? ' error' : ''}`}
                type="password" placeholder="Min. 8 characters"
                {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className={`form-input${errors.confirm ? ' error' : ''}`}
                type="password" placeholder="Repeat password"
                {...register('confirm', {
                  required: 'Required',
                  validate: (v) => v === password || 'Passwords do not match',
                })} />
              {errors.confirm && <p className="form-error">{errors.confirm.message}</p>}
            </div>
          </div>

          <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem', color: 'var(--warning)' }}>
            ⚠️ Your request will be reviewed by a super-admin before you gain access.
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Submit Admin Request'}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-center text-sm text-muted">
          Already have access? <Link to="/login">Sign In</Link>
        </p>
        <p className="text-center text-sm text-muted mt-4">
          Not an admin? <Link to="/register">Register as a user</Link>
        </p>
      </div>
    </div>
  );
}
