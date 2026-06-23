const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/faqs
const getAllFaqs = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, category, question, answer, created_at
     FROM faqs WHERE is_published = TRUE ORDER BY category, created_at`
  );

  // Group by category
  const grouped = result.rows.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  res.json({ faqs: grouped, total: result.rows.length });
});

// GET /api/faqs/:id
const getFaqById = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, category, question, answer FROM faqs WHERE id = $1 AND is_published = TRUE',
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'FAQ not found.' });
  res.json({ faq: result.rows[0] });
});

// POST /api/faqs/:id/bookmark
const addBookmark = asyncHandler(async (req, res) => {
  const faqCheck = await pool.query('SELECT id FROM faqs WHERE id = $1', [req.params.id]);
  if (!faqCheck.rows.length) return res.status(404).json({ error: 'FAQ not found.' });

  await pool.query(
    'INSERT INTO bookmarks (user_id, faq_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.user.id, req.params.id]
  );
  res.status(201).json({ message: 'FAQ bookmarked successfully.' });
});

// DELETE /api/faqs/:id/bookmark
const removeBookmark = asyncHandler(async (req, res) => {
  await pool.query(
    'DELETE FROM bookmarks WHERE user_id = $1 AND faq_id = $2',
    [req.user.id, req.params.id]
  );
  res.json({ message: 'Bookmark removed.' });
});

// GET /api/faqs/bookmarks
const getBookmarks = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT f.id, f.category, f.question, f.answer, b.created_at as bookmarked_at
     FROM bookmarks b
     JOIN faqs f ON b.faq_id = f.id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [req.user.id]
  );
  res.json({ bookmarks: result.rows });
});

module.exports = { getAllFaqs, getFaqById, addBookmark, removeBookmark, getBookmarks };
