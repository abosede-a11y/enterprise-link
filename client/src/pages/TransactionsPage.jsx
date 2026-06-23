import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  completed: 'badge-success', failed: 'badge-danger',
  pending: 'badge-gray', processing: 'badge-warning',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', type: '', status: '', page: 1 });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value, page: 1 }));
  const clearFilters = () => setFilters({ startDate: '', endDate: '', type: '', status: '', page: 1 });

  const handleDownload = async (format) => {
    try {
      const params = new URLSearchParams({ format, ...filters });
      const res = await api.get(`/transactions/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions.${format === 'pdf' ? 'pdf' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch { toast.error('Download failed'); }
  };

  const handlePrint = () => window.print();

  return (
    <div>
      <div className="page-header">
        <h1>Transactions</h1>
        <p>View and manage your full transaction history.</p>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input className="form-input" type="date" name="startDate" value={filters.startDate} onChange={handleFilter} />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input className="form-input" type="date" name="endDate" value={filters.endDate} onChange={handleFilter} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" name="type" value={filters.type} onChange={handleFilter}>
                <option value="">All Types</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={filters.status} onChange={handleFilter}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 0 }}>
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => handleDownload('pdf')}>⬇ Download PDF</button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleDownload('csv')}>⬇ Download CSV</button>
        <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨 Print</button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state"><div className="spinner spinner-dark" /></div>
          ) : transactions.length ? (
            <table>
              <thead>
                <tr><th>Date</th><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th><th>Details</th></tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.reference_number}</td>
                    <td style={{ textTransform: 'capitalize' }}>{t.type}</td>
                    <td style={{ fontWeight: 600 }}>{t.currency} {parseFloat(t.amount).toLocaleString()}</td>
                    <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>{t.status}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelected(t)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <h3>No transactions found</h3>
              <p>Try adjusting your filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>← Prev</button>
            <span className="text-sm text-muted" style={{ alignSelf: 'center' }}>
              Page {filters.page} of {pagination.pages}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={filters.page >= pagination.pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next →</button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ width: 460, maxWidth: '90vw' }}>
            <div className="card-header">
              <span className="card-title">Transaction Details</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="card-body">
              {[
                ['Reference', selected.reference_number],
                ['Type', selected.type],
                ['Amount', `${selected.currency} ${parseFloat(selected.amount).toLocaleString()}`],
                ['Status', selected.status],
                ['Description', selected.description || '—'],
                ['Date', new Date(selected.created_at).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span className="text-muted text-sm">{k}</span>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem', textTransform: 'capitalize' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
