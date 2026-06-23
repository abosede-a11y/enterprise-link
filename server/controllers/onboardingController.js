const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../services/emailService');
const path = require('path');

const ONBOARDING_STEPS = [
  { key: 'business_registration', label: 'Business Registration Certificate' },
  { key: 'proof_of_address', label: 'Proof of Address' },
  { key: 'tax_identification', label: 'Tax Identification Number (TIN)' },
];

// POST /api/onboarding/upload
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const { document_type } = req.body;
  const validTypes = ONBOARDING_STEPS.map((s) => s.key);

  if (!document_type || !validTypes.includes(document_type)) {
    return res.status(400).json({
      error: `document_type must be one of: ${validTypes.join(', ')}`,
    });
  }

  const baseUrl = process.env.NODE_ENV === 'production' 
  ? process.env.RENDER_URL
  : `http://localhost:${process.env.PORT || 5001}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

  // Upsert — replace if same doc type already submitted
  const existing = await pool.query(
    'SELECT id FROM onboarding_documents WHERE user_id = $1 AND document_type = $2',
    [req.user.id, document_type]
  );

  if (existing.rows.length) {
    await pool.query(
      `UPDATE onboarding_documents
       SET file_url = $1, file_name = $2, status = 'submitted', rejection_reason = NULL, submitted_at = NOW()
       WHERE id = $3`,
      [fileUrl, req.file.originalname, existing.rows[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO onboarding_documents (user_id, document_type, file_url, file_name)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, document_type, fileUrl, req.file.originalname]
    );
  }

  // Update user onboarding_status to in_progress if still pending
  await pool.query(
    `UPDATE users SET onboarding_status = 'in_progress', updated_at = NOW()
     WHERE id = $1 AND onboarding_status = 'pending'`,
    [req.user.id]
  );

  // Send email
  const user = await pool.query('SELECT business_name, email FROM users WHERE id = $1', [req.user.id]);
  const tmpl = emailTemplates.documentsUnderReview(user.rows[0].business_name);
  await sendEmail({ to: user.rows[0].email, ...tmpl });

  res.status(201).json({ message: 'Document uploaded successfully.', document_type, status: 'submitted' });
});

// GET /api/onboarding/progress
const getProgress = asyncHandler(async (req, res) => {
  const [userResult, docsResult] = await Promise.all([
    pool.query('SELECT onboarding_status FROM users WHERE id = $1', [req.user.id]),
    pool.query(
      'SELECT document_type, status, file_name, submitted_at, reviewed_at, rejection_reason FROM onboarding_documents WHERE user_id = $1',
      [req.user.id]
    ),
  ]);

  const uploadedDocs = docsResult.rows.reduce((acc, doc) => {
    acc[doc.document_type] = doc;
    return acc;
  }, {});

  const steps = ONBOARDING_STEPS.map((step) => ({
    key: step.key,
    label: step.label,
    status: uploadedDocs[step.key]?.status || 'pending',
    file_name: uploadedDocs[step.key]?.file_name || null,
    submitted_at: uploadedDocs[step.key]?.submitted_at || null,
    reviewed_at: uploadedDocs[step.key]?.reviewed_at || null,
    rejection_reason: uploadedDocs[step.key]?.rejection_reason || null,
  }));

  const completed = steps.filter((s) => s.status === 'approved').length;
  const overall = userResult.rows[0].onboarding_status;

  res.json({
    onboarding_status: overall,
    progress: {
      completed,
      total: steps.length,
      percentage: Math.round((completed / steps.length) * 100),
    },
    steps,
  });
});

module.exports = { uploadDocument, getProgress };
