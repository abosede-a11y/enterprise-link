const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../services/emailService');

// ── Users ──────────────────────────────────────────

// GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = '';
  let params = [];

  if (search) {
    where = `WHERE business_name ILIKE $1 OR email ILIKE $1`;
    params.push(`%${search}%`);
  }

  const [users, count] = await Promise.all([
    pool.query(
      `SELECT id, business_name, email, phone, is_verified, onboarding_status, created_at
       FROM users ${where} ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    ),
    pool.query(`SELECT COUNT(*) FROM users ${where}`, params),
  ]);

  res.json({ users: users.rows, pagination: { total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) } });
});

// GET /api/admin/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const [user, docs, tickets, txCount] = await Promise.all([
    pool.query('SELECT id, business_name, email, phone, address, tax_id, is_verified, onboarding_status, created_at FROM users WHERE id = $1', [req.params.id]),
    pool.query('SELECT * FROM onboarding_documents WHERE user_id = $1', [req.params.id]),
    pool.query('SELECT id, ticket_number, subject, category, status, created_at FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC', [req.params.id]),
    pool.query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [req.params.id]),
  ]);

  if (!user.rows.length) return res.status(404).json({ error: 'User not found.' });

  res.json({ user: user.rows[0], documents: docs.rows, tickets: tickets.rows, transaction_count: parseInt(txCount.rows[0].count) });
});

// ── Onboarding ────────────────────────────────────

// GET /api/admin/onboarding
const getPendingDocuments = asyncHandler(async (req, res) => {
  const { status = 'submitted' } = req.query;

  const result = await pool.query(
    `SELECT od.*, u.business_name, u.email
     FROM onboarding_documents od
     JOIN users u ON od.user_id = u.id
     WHERE od.status = $1
     ORDER BY od.submitted_at ASC`,
    [status]
  );

  res.json({ documents: result.rows });
});

// PUT /api/admin/onboarding/:docId
const reviewDocument = asyncHandler(async (req, res) => {
  const { action, rejection_reason } = req.body; // action: 'approve' | 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be approve or reject.' });
  }
  if (action === 'reject' && !rejection_reason) {
    return res.status(400).json({ error: 'Rejection reason is required.' });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  await pool.query(
    `UPDATE onboarding_documents
     SET status = $1, rejection_reason = $2, reviewed_at = NOW()
     WHERE id = $3`,
    [newStatus, rejection_reason || null, req.params.docId]
  );

  // Check if all docs approved → mark user as completed
  const doc = await pool.query('SELECT user_id FROM onboarding_documents WHERE id = $1', [req.params.docId]);
  const userId = doc.rows[0].user_id;

  const allDocs = await pool.query(
    'SELECT status FROM onboarding_documents WHERE user_id = $1',
    [userId]
  );

  const allApproved = allDocs.rows.length === 3 && allDocs.rows.every((d) => d.status === 'approved');
  const anyRejected = allDocs.rows.some((d) => d.status === 'rejected');

  if (allApproved) {
    await pool.query(
      `UPDATE users SET onboarding_status = 'completed', is_verified = TRUE, updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  } else if (anyRejected) {
    await pool.query(
      `UPDATE users SET onboarding_status = 'in_progress', updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  }

  // Send email notification
  const user = await pool.query('SELECT business_name, email FROM users WHERE id = $1', [userId]);
  if (allApproved || anyRejected) {
    const tmpl = emailTemplates.onboardingComplete(user.rows[0].business_name, allApproved);
    await sendEmail({ to: user.rows[0].email, ...tmpl });
  }

  res.json({ message: `Document ${newStatus} successfully.`, all_approved: allApproved });
});

// ── Transactions ──────────────────────────────────

// GET /api/admin/transactions
const getAllTransactions = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let conditions = [];
  let params = [];
  let idx = 1;

  if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
  if (type) { conditions.push(`t.type = $${idx++}`); params.push(type); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT t.*, u.business_name, u.email
     FROM transactions t JOIN users u ON t.user_id = u.id
     ${where} ORDER BY t.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, parseInt(limit), offset]
  );

  const count = await pool.query(`SELECT COUNT(*) FROM transactions t ${where}`, params);

  res.json({ transactions: result.rows, pagination: { total: parseInt(count.rows[0].count), page: parseInt(page) } });
});

// POST /api/admin/transactions — seed a test transaction
const createTransaction = asyncHandler(async (req, res) => {
  const { user_id, type, amount, currency = 'NGN', description, status = 'completed' } = req.body;

  if (!user_id || !type || !amount) {
    return res.status(400).json({ error: 'user_id, type, and amount are required.' });
  }

  const reference = `TXN-${Date.now().toString(36).toUpperCase()}`;

  const result = await pool.query(
    `INSERT INTO transactions (user_id, reference_number, type, amount, currency, description, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [user_id, reference, type, amount, currency, description, status]
  );

  res.status(201).json({ transaction: result.rows[0] });
});

// ── Support Tickets ────────────────────────────────

// GET /api/admin/tickets
const getAllTickets = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = '';
  let params = [];

  if (status) { where = 'WHERE st.status = $1'; params.push(status); }

  const result = await pool.query(
    `SELECT st.*, u.business_name, u.email
     FROM support_tickets st JOIN users u ON st.user_id = u.id
     ${where} ORDER BY st.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, parseInt(limit), offset]
  );

  const count = await pool.query(`SELECT COUNT(*) FROM support_tickets st ${where}`, params);

  res.json({ tickets: result.rows, pagination: { total: parseInt(count.rows[0].count), page: parseInt(page) } });
});

// PUT /api/admin/tickets/:id
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['open', 'in_progress', 'resolved'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const result = await pool.query(
    `UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );

  if (!result.rows.length) return res.status(404).json({ error: 'Ticket not found.' });

  res.json({ message: 'Ticket status updated.', ticket: result.rows[0] });
});

// ── FAQs ──────────────────────────────────────────

// GET /api/admin/faqs
const adminGetFaqs = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM faqs ORDER BY category, created_at');
  res.json({ faqs: result.rows });
});

// POST /api/admin/faqs
const createFaq = asyncHandler(async (req, res) => {
  const { category, question, answer } = req.body;
  if (!category || !question || !answer) {
    return res.status(400).json({ error: 'Category, question, and answer are required.' });
  }
  const result = await pool.query(
    'INSERT INTO faqs (category, question, answer) VALUES ($1, $2, $3) RETURNING *',
    [category, question, answer]
  );
  res.status(201).json({ faq: result.rows[0] });
});

// PUT /api/admin/faqs/:id
const updateFaq = asyncHandler(async (req, res) => {
  const { category, question, answer, is_published } = req.body;
  const result = await pool.query(
    `UPDATE faqs SET
       category = COALESCE($1, category),
       question = COALESCE($2, question),
       answer = COALESCE($3, answer),
       is_published = COALESCE($4, is_published)
     WHERE id = $5 RETURNING *`,
    [category, question, answer, is_published, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'FAQ not found.' });
  res.json({ faq: result.rows[0] });
});

// DELETE /api/admin/faqs/:id
const deleteFaq = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM faqs WHERE id = $1', [req.params.id]);
  res.json({ message: 'FAQ deleted.' });
});

// ── Dashboard Stats ────────────────────────────────

// GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [users, pendingDocs, openTickets, transactions] = await Promise.all([
    pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_verified) as verified FROM users'),
    pool.query("SELECT COUNT(*) FROM onboarding_documents WHERE status = 'submitted'"),
    pool.query("SELECT COUNT(*) FROM support_tickets WHERE status = 'open'"),
    pool.query("SELECT COUNT(*), COALESCE(SUM(amount), 0) as total_amount FROM transactions WHERE status = 'completed'"),
  ]);

  res.json({
    users: { total: parseInt(users.rows[0].total), verified: parseInt(users.rows[0].verified) },
    pending_documents: parseInt(pendingDocs.rows[0].count),
    open_tickets: parseInt(openTickets.rows[0].count),
    transactions: { count: parseInt(transactions.rows[0].count), total_amount: parseFloat(transactions.rows[0].total_amount) },
  });
});

module.exports = {
  getUsers, getUserById,
  getPendingDocuments, reviewDocument,
  getAllTransactions, createTransaction,
  getAllTickets, updateTicketStatus,
  adminGetFaqs, createFaq, updateFaq, deleteFaq,
  getStats,
};
