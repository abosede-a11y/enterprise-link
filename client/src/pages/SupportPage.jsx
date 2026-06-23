import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = { open: 'badge-blue', in_progress: 'badge-warning', resolved: 'badge-success' };
const CATEGORIES = ['Technical Issue', 'Account & Profile', 'Transactions', 'Onboarding', 'Billing', 'Other'];

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState('tickets'); // 'tickets' | 'new'
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/support/tickets');
      setTickets(res.data.tickets);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadTickets(); }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const form = new FormData();
    form.append('subject', data.subject);
    form.append('category', data.category);
    form.append('description', data.description);
    files.forEach((f) => form.append('attachments', f));
    try {
      await api.post('/support/tickets', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Support request submitted! We\'ll get back to you within 24 hours.');
      reset();
      setFiles([]);
      setView('tickets');
      loadTickets();
    } catch {}
    finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Support</h1>
            <p>Submit a request or track your existing tickets.</p>
          </div>
          <button
            className={`btn btn-sm ${view === 'new' ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setView(view === 'new' ? 'tickets' : 'new')}
          >
            {view === 'new' ? '← My Tickets' : '+ Raise a Ticket'}
          </button>
        </div>
      </div>

      {view === 'new' ? (
        /* Submit Form */
        <div className="card">
          <div className="card-header"><span className="card-title">New Support Request</span></div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input className={`form-input${errors.subject ? ' error' : ''}`} placeholder="Brief description of your issue"
                    {...register('subject', { required: 'Subject is required' })} />
                  {errors.subject && <p className="form-error">{errors.subject.message}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className={`form-select${errors.category ? ' error' : ''}`}
                    {...register('category', { required: 'Category is required' })}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="form-error">{errors.category.message}</p>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className={`form-textarea${errors.description ? ' error' : ''}`}
                  rows={5} placeholder="Describe your issue in detail..."
                  {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'At least 20 characters' } })} />
                {errors.description && <p className="form-error">{errors.description.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Attachments (optional)</label>
                <label className="upload-zone">
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                    onChange={(e) => setFiles(Array.from(e.target.files))} />
                  <div>📎</div>
                  <p>Click to attach files (PDF, JPG, PNG — max 5 files)</p>
                </label>
                {files.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {files.map((f, i) => (
                      <span key={i} className="badge badge-blue">📄 {f.name}</span>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? <><span className="spinner" /> Submitting...</> : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Tickets List */
        <div className="card">
          <div className="card-header">
            <span className="card-title">My Tickets ({tickets.length})</span>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div className="empty-state"><div className="spinner spinner-dark" /></div>
            ) : tickets.length ? (
              <table>
                <thead>
                  <tr><th>Ticket #</th><th>Subject</th><th>Category</th><th>Status</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.ticket_number}</td>
                      <td style={{ fontWeight: 500 }}>{t.subject}</td>
                      <td>{t.category}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td><button className="btn btn-secondary btn-sm" onClick={() => setSelected(t)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🎧</div>
                <h3>No tickets yet</h3>
                <p>Click "Raise a Ticket" to contact our support team.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ width: 520, maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <div>
                <div className="card-title">{selected.subject}</div>
                <div className="text-sm text-muted" style={{ marginTop: 2 }}>#{selected.ticket_number}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="card-body" style={{ overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <span className={`badge ${STATUS_BADGE[selected.status] || 'badge-gray'}`}>{selected.status.replace('_', ' ')}</span>
                <span className="badge badge-gray">{selected.category}</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.7 }}>{selected.description}</div>
              {selected.attachments?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div className="text-sm fw-600" style={{ marginBottom: 8 }}>Attachments</div>
                  {selected.attachments.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer" className="badge badge-blue" style={{ marginRight: 6 }}>📎 {a.name}</a>
                  ))}
                </div>
              )}
              <div className="text-sm text-muted" style={{ marginTop: 16 }}>
                Submitted on {new Date(selected.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
