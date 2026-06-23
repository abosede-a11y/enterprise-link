require('dotenv').config();
const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  const email = process.argv[2];
  const password = process.argv[3];
  const business_name = process.argv[4] || 'Admin';

  if (!email || !password) {
    console.log('Usage: node scripts/createAdmin.js <email> <password> [name]');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 12);

    // Check if user exists → upgrade to admin, else create
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length) {
      await pool.query('UPDATE users SET is_admin = TRUE WHERE email = $1', [email]);
      console.log(`✅ Existing user ${email} upgraded to admin.`);
    } else {
      await pool.query(
        `INSERT INTO users (business_name, email, password_hash, is_admin, is_verified, onboarding_status)
         VALUES ($1, $2, $3, TRUE, TRUE, 'completed')`,
        [business_name, email, hash]
      );
      console.log(`✅ Admin user created: ${email}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

createAdmin();
