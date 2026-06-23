const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/profile
const getProfile = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, business_name, email, phone, address, tax_id, profile_picture,
            is_verified, onboarding_status, created_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  res.json({ user: result.rows[0] });
});

// PUT /api/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { business_name, phone, address, tax_id } = req.body;

  const result = await pool.query(
    `UPDATE users
     SET business_name = COALESCE($1, business_name),
         phone = COALESCE($2, phone),
         address = COALESCE($3, address),
         tax_id = COALESCE($4, tax_id),
         updated_at = NOW()
     WHERE id = $5
     RETURNING id, business_name, email, phone, address, tax_id, is_verified, onboarding_status`,
    [business_name, phone, address, tax_id, req.user.id]
  );

  res.json({ message: 'Profile updated successfully.', user: result.rows[0] });
});

module.exports = { getProfile, updateProfile };
