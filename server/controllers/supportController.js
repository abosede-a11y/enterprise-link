const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../services/emailService');

const generateTicketNumber = () =>
  `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

const VALID_CATEGORIES = ['Technical Issue', 'Account & Profile', 'Transactions', 'Onboarding', 'Billing', 'Other'];

// POST /api/support/tickets
const submitTicket = asyncHandler(async (req, res) => {
  const { subject, category, description } = req.body;

  if (!subject || !category || !description) {
    return res.status(400).json({ error: 'Subject, category, and description are required.' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  const attachments = req.files
    ? req.files.map((f) => ({ name: f.originalname, url: `/uploads/${f.filename}` }))
    : [];

  const ticketNumber = generateTicketNumber();

  const result = await pool.query(
    `INSERT INTO support_tickets (user_id, ticket_number, subject, category, description, attachments)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, ticket_number, subject, category, status, created_at`,
    [req.user.id, ticketNumber, subject, category, description, JSON.stringify(attachments)]
  );

  const ticket = result.rows[0];

  const user = await pool.query('SELECT business_name, email FROM users WHERE id = $1', [req.user.id]);
  const tmpl = emailTemplates.ticketReceived(user.rows[0].business_name, ticket.ticket_number, ticket.subject);
  await sendEmail({ to: user.rows[0].email, ...tmpl });

  res.status(201).json({
    message: 'Support request submitted successfully.',
    ticket,
  });
});

// GET /api/support/tickets
const getTickets = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let conditions = ['user_id = $1'];
  let params = [req.user.id];

  if (status) { conditions.push(`status = $2`); params.push(status); }

  const result = await pool.query(
    `SELECT id, ticket_number, subject, category, status, created_at, updated_at
     FROM support_tickets WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, parseInt(limit), offset]
  );

  const count = await pool.query(
    `SELECT COUNT(*) FROM support_tickets WHERE ${conditions.join(' AND ')}`,
    params
  );

  res.json({
    tickets: result.rows,
    pagination: {
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    },
  });
});

// GET /api/support/tickets/:id
const getTicketById = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Ticket not found.' });
  res.json({ ticket: result.rows[0] });
});

module.exports = { submitTicket, getTickets, getTicketById };
