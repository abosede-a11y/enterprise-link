const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
  process.exit(-1);
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        tax_id VARCHAR(100),
        profile_picture VARCHAR(500),
        is_verified BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        onboarding_status VARCHAR(50) DEFAULT 'pending',
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS faqs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(100) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        faq_id UUID REFERENCES faqs(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, faq_id)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        reference_number VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'NGN',
        status VARCHAR(50) DEFAULT 'pending',
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS onboarding_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        document_type VARCHAR(100) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'submitted',
        rejection_reason TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        reviewed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON onboarding_documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON support_tickets(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);

    // Seed sample FAQs if none exist
    const faqCount = await client.query('SELECT COUNT(*) FROM faqs');
    if (parseInt(faqCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO faqs (category, question, answer) VALUES
        ('Getting Started', 'How do I create a business account?', 'Click the Register/Sign Up button on the homepage, fill in your business details, and verify your email address. You will then have access to all platform services.'),
        ('Getting Started', 'What documents do I need for onboarding?', 'You will need your business registration certificate, proof of address (utility bill or bank statement), and your Tax Identification Number (TIN).'),
        ('Transactions', 'How long do transactions take to process?', 'Most transactions are processed within 24-48 business hours. You can track the status of your transaction from the Transactions page.'),
        ('Transactions', 'What transaction statuses mean?', 'Pending: transaction is queued. Processing: actively being processed. Completed: successfully done. Failed: transaction was not completed.'),
        ('Account & Security', 'How do I reset my password?', 'Click the "Forgot Password" link on the login page, enter your registered email, and follow the link sent to your email to create a new password.'),
        ('Account & Security', 'How do I update my business profile?', 'Navigate to your profile page and click the Edit button. Update your information and click Save to apply the changes.'),
        ('Support', 'How do I contact support?', 'You can submit a support request from the Support section. Provide a subject, category, and description of your issue. Our team responds within 24 hours.'),
        ('Onboarding', 'How long does verification take?', 'Document verification typically takes 2-3 business days. You will receive an email notification once the process is complete.');
      `);
    }

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database init error:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
