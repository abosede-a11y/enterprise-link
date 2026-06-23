const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const adminProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT id, business_name, email, is_admin, is_super_admin FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows.length) return res.status(401).json({ error: 'User not found.' });
    if (!result.rows[0].is_admin && !result.rows[0].is_super_admin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = { adminProtect };
