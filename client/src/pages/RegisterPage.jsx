import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        business_name: data.business_name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      login(res.data.token, res.data.user);
      toast.success('Account created! Welcome to Enterprise Link.');
      navigate('/onboarding');
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">EnterpriseLink</div>
        <p className="auth-subtitle">Create your business account</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input
              className={`form-input${errors.business_name ? ' error' : ''}`}
              placeholder="Acme Ltd."
              {...register('business_name', { required: 'Business name is required' })}
            />
            {errors.business_name && <p className="form-error">{errors.business_name.message}</p>}
          </div>

          <div className="form-row">
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
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                placeholder="+234 800 000 0000"
                {...register('phone')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className={`form-input${errors.password ? ' error' : ''}`}
                type="password" placeholder="Min. 8 characters"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
              />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className={`form-input${errors.confirm ? ' error' : ''}`}
                type="password" placeholder="Repeat password"
                {...register('confirm', {
                  required: 'Please confirm your password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
              {errors.confirm && <p className="form-error">{errors.confirm.message}</p>}
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-center text-sm text-muted">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
