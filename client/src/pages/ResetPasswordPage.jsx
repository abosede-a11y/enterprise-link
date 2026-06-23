import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const token = new URLSearchParams(window.location.search).get('token');
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      setDone(true);
      toast.success('Password reset successfully!');
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">EnterpriseLink</div>
        <p className="auth-subtitle">Set a new password</p>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem' }}>✅</div>
            <p style={{ marginTop: 12 }}>Your password has been updated.</p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Sign In</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className={`form-input${errors.password ? ' error' : ''}`} type="password" placeholder="Min. 8 characters"
                {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className={`form-input${errors.confirm ? ' error' : ''}`} type="password" placeholder="Repeat password"
                {...register('confirm', { required: 'Required', validate: (v) => v === password || 'Passwords do not match' })} />
              {errors.confirm && <p className="form-error">{errors.confirm.message}</p>}
            </div>
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
