const express = require('express');
const router = express.Router();
const { submitTicket, getTickets, getTicketById } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(protect);
router.post('/tickets', upload.array('attachments', 5), submitTicket);
router.get('/tickets', getTickets);
router.get('/tickets/:id', getTicketById);

module.exports = router;
