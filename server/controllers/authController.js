const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { asyncHandler } = require('../middleware/errorHandler');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { business_name, email, password, phone } = req.body;

  if (!business_name || !email || !password) {
    return res.status(400).json({ error: 'Business name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (business_name, email, password_hash, phone, is_verified, email_verified)
    VALUES ($1, $2, $3, $4, TRUE, TRUE) RETURNING id, business_name, email, onboarding_status, created_at`,
    [business_name, email.toLowerCase(), password_hash, phone || null]
  );

  const user = result.rows[0];
  const token = generateToken(user.id);

  const tmpl = emailTemplates.welcome(user.business_name);
  await sendEmail({ to: user.email, ...tmpl });

  res.status(201).json({
    message: 'Account created successfully.',
    token,
    user: {
      id: user.id,
      business_name: user.business_name,
      email: user.email,
      onboarding_status: user.onboarding_status,
      is_admin: user.is_admin,
      is_super_admin: user.is_super_admin,
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const result = await pool.query(
    'SELECT id, business_name, email, password_hash, is_verified, onboarding_status, is_admin, is_super_admin FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (!result.rows.length) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user.id);

  res.json({
    message: 'Logged in successfully.',
    token,
    user: {
      id: user.id,
      business_name: user.business_name,
      email: user.email,
      is_verified: user.is_verified,
      onboarding_status: user.onboarding_status,
      is_admin: user.is_admin,
      is_super_admin: user.is_super_admin,
    },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  // JWT is stateless — logout is handled client-side by deleting the token
  res.json({ message: 'Logged out successfully.' });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const result = await pool.query(
      'SELECT id, business_name, email, password_hash, is_verified, onboarding_status, is_admin, is_super_admin FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  // Always return success to prevent email enumeration
  if (!result.rows.length) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  const user = result.rows[0];
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
    [resetToken, resetExpires, user.id]
  );

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  const tmpl = emailTemplates.resetPassword(user.business_name, resetUrl);
  await sendEmail({ to: user.email, ...tmpl });

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const result = await pool.query(
    `SELECT id FROM users
     WHERE reset_password_token = $1 AND reset_password_expires > NOW()`,
    [token]
  );

  if (!result.rows.length) {
    return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
  }

  const password_hash = await bcrypt.hash(password, 12);
  await pool.query(
    `UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW()
     WHERE id = $2`,
    [password_hash, result.rows[0].id]
  );

  res.json({ message: 'Password reset successfully. You can now log in.' });
});

// POST /api/auth/register-admin
const registerAdmin = asyncHandler(async (req, res) => {
  const { business_name, email, password, phone } = req.body;

  if (!business_name || !email || !password) {
    return res.status(400).json({ error: 'Business name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (business_name, email, password_hash, phone, is_pending_admin, is_verified, onboarding_status)
     VALUES ($1, $2, $3, $4, TRUE, TRUE, 'completed')
     RETURNING id, business_name, email`,
    [business_name, email.toLowerCase(), password_hash, phone || null]
  );

  const user = result.rows[0];

  // Notify super admin
  const superAdmins = await pool.query(
    'SELECT email, business_name FROM users WHERE is_super_admin = TRUE'
  );

  for (const admin of superAdmins.rows) {
    await sendEmail({
      to: admin.email,
      subject: 'New Admin Registration Request',
      html: `
        <h2>New Admin Request</h2>
        <p>Hi ${admin.business_name},</p>
        <p>A new admin registration request has been submitted:</p>
        <p><strong>Name:</strong> ${user.business_name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p>Please log in to the admin portal to approve or reject this request.</p>
        <a href="${process.env.CLIENT_URL}/admin/dashboard" 
           style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">
          Review Request
        </a>
      `,
    });
  }

  res.status(201).json({
    message: 'Admin registration submitted. A super-admin will review your request.',
  });
});

module.exports = { register, login, logout, forgotPassword, resetPassword, registerAdmin };
