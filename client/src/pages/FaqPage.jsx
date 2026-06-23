import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function FaqPage() {
  const [faqs, setFaqs] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    const load = async () => {
      const [faqRes, bmRes] = await Promise.all([api.get('/faqs'), api.get('/faqs/bookmarks')]);
      setFaqs(faqRes.data.faqs);
      setBookmarks(new Set(bmRes.data.bookmarks.map((b) => b.id)));
    };
    load();
  }, []);

  const toggleBookmark = async (faqId) => {
    const isBookmarked = bookmarks.has(faqId);
    try {
      if (isBookmarked) {
        await api.delete(`/faqs/${faqId}/bookmark`);
        setBookmarks((b) => { const n = new Set(b); n.delete(faqId); return n; });
        toast.success('Bookmark removed');
      } else {
        await api.post(`/faqs/${faqId}/bookmark`);
        setBookmarks((b) => new Set([...b, faqId]));
        toast.success('FAQ bookmarked');
      }
    } catch {}
  };

  const allFaqs = Object.values(faqs).flat();
  const filtered = search
    ? allFaqs.filter((f) => f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase()))
    : null;

  const bookmarkedFaqs = allFaqs.filter((f) => bookmarks.has(f.id));

  const displayFaqs = search
    ? { 'Search Results': filtered }
    : tab === 'bookmarks'
    ? { 'My Bookmarks': bookmarkedFaqs }
    : faqs;

  return (
    <div>
      <div className="page-header">
        <h1>Frequently Asked Questions</h1>
        <p>Find answers to common questions about Enterprise Link.</p>
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="card-body">
          <input
            className="form-input" placeholder="🔍  Search questions..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '1rem' }}
          />
        </div>
      </div>

      {/* Tabs */}
      {!search && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('all')}>All FAQs</button>
          <button className={`btn btn-sm ${tab === 'bookmarks' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('bookmarks')}>
            🔖 Bookmarks ({bookmarks.size})
          </button>
        </div>
      )}

      {Object.entries(displayFaqs).map(([category, items]) => (
        !items?.length ? (
          tab === 'bookmarks' && !search ? (
            <div key={category} className="empty-state">
              <div className="empty-state-icon">🔖</div>
              <h3>No bookmarks yet</h3>
              <p>Click the bookmark icon on any FAQ to save it here.</p>
            </div>
          ) : null
        ) : (
          <div key={category} className="faq-category">
            <div className="faq-category-title">
              <span>📁</span> {category}
              <span className="badge badge-blue" style={{ marginLeft: 8 }}>{items.length}</span>
            </div>
            {items.map((faq) => (
              <div key={faq.id} className="faq-item">
                <div className="faq-question" onClick={() => setOpen(open === faq.id ? null : faq.id)}>
                  <span>{faq.question}</span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(faq.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px', borderRadius: 4 }}
                      title={bookmarks.has(faq.id) ? 'Remove bookmark' : 'Bookmark this FAQ'}
                    >
                      {bookmarks.has(faq.id) ? '🔖' : '🏷️'}
                    </button>
                    <span style={{ color: 'var(--gray-400)' }}>{open === faq.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                {open === faq.id && <div className="faq-answer">{faq.answer}</div>}
              </div>
            ))}
          </div>
        )
      ))}
    </div>
  );
}
