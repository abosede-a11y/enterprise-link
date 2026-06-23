import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    api.get('/profile').then((res) => {
      setProfile(res.data.user);
      reset(res.data.user);
    });
  }, [reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.put('/profile', {
        business_name: data.business_name,
        phone: data.phone,
        address: data.address,
        tax_id: data.tax_id,
      });
      setProfile(res.data.user);
      updateUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated successfully.');
    } catch {}
    finally { setLoading(false); }
  };

  const initials = user?.business_name?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div>
      <div className="page-header">
        <h1>Business Profile</h1>
        <p>Manage your business information.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Left — Avatar */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)',
              color: '#fff', fontSize: '1.8rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>{initials}</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile?.business_name}</div>
            <div className="text-sm text-muted" style={{ marginTop: 4 }}>{profile?.email}</div>
            <div style={{ marginTop: 12 }}>
              <span className={`badge ${profile?.is_verified ? 'badge-success' : 'badge-warning'}`}>
                {profile?.is_verified ? '✅ Verified' : '⏳ Pending Verification'}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span className={`badge ${
                profile?.onboarding_status === 'completed' ? 'badge-success' :
                profile?.onboarding_status === 'in_progress' ? 'badge-warning' : 'badge-gray'
              }`}>
                Onboarding: {profile?.onboarding_status?.replace('_', ' ')}
              </span>
            </div>
            <div className="text-sm text-muted" style={{ marginTop: 12 }}>
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>

        {/* Right — Details */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Business Information</span>
            {!editing && (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
            )}
          </div>
          <div className="card-body">
            {editing ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input className={`form-input${errors.business_name ? ' error' : ''}`}
                    {...register('business_name', { required: 'Required' })} />
                  {errors.business_name && <p className="form-error">{errors.business_name.message}</p>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" {...register('phone')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax ID (TIN)</label>
                    <input className="form-input" {...register('tax_id')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Business Address</label>
                  <textarea className="form-textarea" rows={3} {...register('address')} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Save Changes'}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => { setEditing(false); reset(profile); }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {[
                  ['Business Name', profile?.business_name],
                  ['Email Address', profile?.email],
                  ['Phone Number', profile?.phone || '—'],
                  ['Tax ID (TIN)', profile?.tax_id || '—'],
                  ['Business Address', profile?.address || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ width: 180, fontSize: '0.875rem', color: 'var(--gray-500)', flexShrink: 0 }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
