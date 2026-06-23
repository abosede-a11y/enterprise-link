const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const PDFDocument = require('pdfkit');

// GET /api/transactions
const getTransactions = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, status, minAmount, maxAmount, page = 1, limit = 20 } = req.query;

  let conditions = ['t.user_id = $1'];
  let params = [req.user.id];
  let idx = 2;

  if (startDate) { conditions.push(`t.created_at >= $${idx++}`); params.push(startDate); }
  if (endDate) { conditions.push(`t.created_at <= $${idx++}`); params.push(endDate + ' 23:59:59'); }
  if (type) { conditions.push(`t.type = $${idx++}`); params.push(type); }
  if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
  if (minAmount) { conditions.push(`t.amount >= $${idx++}`); params.push(parseFloat(minAmount)); }
  if (maxAmount) { conditions.push(`t.amount <= $${idx++}`); params.push(parseFloat(maxAmount)); }

  const where = conditions.join(' AND ');
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT id, reference_number, type, amount, currency, status, description, created_at
       FROM transactions t WHERE ${where}
       ORDER BY t.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, parseInt(limit), offset]
    ),
    pool.query(`SELECT COUNT(*) FROM transactions t WHERE ${where}`, params),
  ]);

  res.json({
    transactions: rows.rows,
    pagination: {
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(parseInt(count.rows[0].count) / parseInt(limit)),
    },
  });
});

// GET /api/transactions/:id
const getTransactionById = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Transaction not found.' });
  res.json({ transaction: result.rows[0] });
});

// GET /api/transactions/export
const exportTransactions = asyncHandler(async (req, res) => {
  const { format = 'pdf', startDate, endDate, status } = req.query;

  let conditions = ['user_id = $1'];
  let params = [req.user.id];
  let idx = 2;

  if (startDate) { conditions.push(`created_at >= $${idx++}`); params.push(startDate); }
  if (endDate) { conditions.push(`created_at <= $${idx++}`); params.push(endDate + ' 23:59:59'); }
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }

  const result = await pool.query(
    `SELECT reference_number, type, amount, currency, status, description, created_at
     FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
    params
  );

  const transactions = result.rows;

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="transaction-statement.pdf"');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Enterprise Link', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Transaction Statement', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(2);

    // Table header
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Date', 50, doc.y, { width: 100 });
    doc.text('Reference', 150, doc.y - doc.currentLineHeight(), { width: 120 });
    doc.text('Type', 270, doc.y - doc.currentLineHeight(), { width: 80 });
    doc.text('Amount', 350, doc.y - doc.currentLineHeight(), { width: 80 });
    doc.text('Status', 430, doc.y - doc.currentLineHeight(), { width: 80 });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table rows
    doc.font('Helvetica').fontSize(9);
    transactions.forEach((t) => {
      const y = doc.y;
      doc.text(new Date(t.created_at).toLocaleDateString(), 50, y, { width: 100 });
      doc.text(t.reference_number, 150, y, { width: 120 });
      doc.text(t.type, 270, y, { width: 80 });
      doc.text(`${t.currency} ${parseFloat(t.amount).toLocaleString()}`, 350, y, { width: 80 });
      doc.text(t.status, 430, y, { width: 80 });
      doc.moveDown();
    });

    doc.moveDown();
    doc.font('Helvetica-Bold').text(`Total Records: ${transactions.length}`);
    doc.end();
  } else {
    // CSV fallback
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    const header = 'Date,Reference,Type,Amount,Currency,Status,Description\n';
    const rows = transactions.map(
      (t) => `${new Date(t.created_at).toLocaleDateString()},"${t.reference_number}","${t.type}",${t.amount},${t.currency},"${t.status}","${t.description || ''}"`
    ).join('\n');
    res.send(header + rows);
  }
});

module.exports = { getTransactions, getTransactionById, exportTransactions };
