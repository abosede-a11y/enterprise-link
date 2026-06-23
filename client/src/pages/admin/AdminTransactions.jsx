import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = { completed: 'badge-success', failed: 'badge-danger', pending: 'badge-gray', processing: 'badge-warning' };

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSeed, setShowSeed] = useState(false);
  const [form, setForm] = useState({ user_id: '', type: 'credit', amount: '', currency: 'NGN', description: '', status: 'completed' });

  const load = async () => {
    setLoading(true);
    try {
      const [txRes, userRes] = await Promise.all([
        api.get('/admin/transactions'),
        api.get('/admin/users'),
      ]);
      setTransactions(txRes.data.transactions);
      setUsers(userRes.data.users);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    if (!form.user_id || !form.amount) { toast.error('User and amount are required.'); return; }
    try {
      await api.post('/admin/transactions', form);
      toast.success('Transaction created!');
      setShowSeed(false);
      setForm({ user_id: '', type: 'credit', amount: '', currency: 'NGN', description: '', status: 'completed' });
      load();
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Transactions</h1>
            <p>All platform transactions.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowSeed(!showSeed)}>
            {showSeed ? 'Cancel' : '+ Add Transaction'}
          </button>
        </div>
      </div>

      {showSeed && (
        <div className="card mb-4">
          <div className="card-header"><span className="card-title">Add Transaction for User</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">User *</label>
                <select className="form-select" value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}>
                  <option value="">Select user...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.business_name} ({u.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount *</label>
                <input className="form-input" type="number" placeholder="e.g. 50000" value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="e.g. Payment for services" value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={handleSeed}>Create Transaction</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="empty-state"><div className="spinner spinner-dark" /></div> :
            transactions.length ? (
              <table>
                <thead>
                  <tr><th>Date</th><th>Business</th><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>{t.business_name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.reference_number}</td>
                      <td style={{ textTransform: 'capitalize' }}>{t.type}</td>
                      <td style={{ fontWeight: 600 }}>{t.currency} {parseFloat(t.amount).toLocaleString()}</td>
                      <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><div className="empty-state-icon">💳</div><h3>No transactions yet</h3><p>Use "+ Add Transaction" to create one for a user.</p></div>
            )}
        </div>
      </div>
    </div>
  );
}
