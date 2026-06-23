import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Support Tickets ──────────────────────────────────────────────────────────

export function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async (status = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/tickets?status=${status}`);
      setTickets(res.data.tickets);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(filter); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/tickets/${id}`, { status });
      toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
      load(filter);
      setSelected(null);
    } catch {}
  };

  const STATUS_BADGE = { open: 'badge-blue', in_progress: 'badge-warning', resolved: 'badge-success' };

  return (
    <div>
      <div className="page-header">
        <h1>Support Tickets</h1>
        <p>Manage and respond to user support requests.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['', 'All'], ['open', 'Open'], ['in_progress', 'In Progress'], ['resolved', 'Resolved']].map(([val, label]) => (
          <button key={val} className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(val)}>{label}</button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="empty-state"><div className="spinner spinner-dark" /></div> :
            tickets.length ? (
              <table>
                <thead>
                  <tr><th>Ticket #</th><th>Business</th><th>Subject</th><th>Category</th><th>Status</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.ticket_number}</td>
                      <td style={{ fontWeight: 500 }}>{t.business_name}</td>
                      <td>{t.subject}</td>
                      <td>{t.category}</td>
                      <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>{t.status.replace('_', ' ')}</span></td>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td><button className="btn btn-secondary btn-sm" onClick={() => setSelected(t)}>Manage</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><div className="empty-state-icon">🎧</div><h3>No tickets found</h3></div>
            )}
        </div>
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div className="card" style={{ width: 540, maxWidth: '95vw' }}>
            <div className="card-header">
              <div>
                <div className="card-title">{selected.subject}</div>
                <div className="text-sm text-muted">{selected.business_name} · #{selected.ticket_number}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 16 }}>
                <span className={`badge ${STATUS_BADGE[selected.status]}`}>{selected.status.replace('_', ' ')}</span>
                <span className="badge badge-gray" style={{ marginLeft: 8 }}>{selected.category}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.7, marginBottom: 20 }}>{selected.description}</p>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Update Status:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(selected.id, 'open')}>Open</button>
                <button className="btn btn-sm" style={{ background: 'var(--warning)', color: '#fff' }} onClick={() => updateStatus(selected.id, 'in_progress')}>In Progress</button>
                <button className="btn btn-success btn-sm" onClick={() => updateStatus(selected.id, 'resolved')}>Resolved</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── FAQs ─────────────────────────────────────────────────────────────────────

export function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: '', question: '', answer: '' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/faqs');
      setFaqs(res.data.faqs);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.category || !form.question || !form.answer) {
      toast.error('All fields are required.'); return;
    }
    try {
      if (editing) {
        await api.put(`/admin/faqs/${editing}`, form);
        toast.success('FAQ updated.');
      } else {
        await api.post('/admin/faqs', form);
        toast.success('FAQ created.');
      }
      setForm({ category: '', question: '', answer: '' });
      setEditing(null);
      setShowForm(false);
      load();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    await api.delete(`/admin/faqs/${id}`);
    toast.success('FAQ deleted.');
    load();
  };

  const handleToggle = async (faq) => {
    await api.put(`/admin/faqs/${faq.id}`, { is_published: !faq.is_published });
    toast.success(`FAQ ${faq.is_published ? 'unpublished' : 'published'}.`);
    load();
  };

  const startEdit = (faq) => {
    setForm({ category: faq.category, question: faq.question, answer: faq.answer });
    setEditing(faq.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>FAQ Management</h1>
            <p>Create, edit, and publish FAQs for users.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ category: '', question: '', answer: '' }); }}>
            {showForm ? 'Cancel' : '+ New FAQ'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header"><span className="card-title">{editing ? 'Edit FAQ' : 'New FAQ'}</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" placeholder="e.g. Getting Started" value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Question</label>
              <input className="form-input" value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Answer</label>
              <textarea className="form-textarea" rows={4} value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Save Changes' : 'Create FAQ'}</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="empty-state"><div className="spinner spinner-dark" /></div> :
            faqs.length ? (
              <table>
                <thead><tr><th>Category</th><th>Question</th><th>Published</th><th>Actions</th></tr></thead>
                <tbody>
                  {faqs.map((f) => (
                    <tr key={f.id}>
                      <td><span className="badge badge-blue">{f.category}</span></td>
                      <td style={{ maxWidth: 300 }}>{f.question}</td>
                      <td>
                        <button className={`badge ${f.is_published ? 'badge-success' : 'badge-gray'}`}
                          style={{ border: 'none', cursor: 'pointer' }} onClick={() => handleToggle(f)}>
                          {f.is_published ? '✅ Published' : '⬜ Draft'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(f)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="empty-state"><div className="empty-state-icon">❓</div><h3>No FAQs yet</h3></div>}
        </div>
      </div>
    </div>
  );
}
