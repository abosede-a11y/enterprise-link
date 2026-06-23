const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminMiddleware');
const {
  getUsers, getUserById,
  getPendingDocuments, reviewDocument,
  getAllTransactions, createTransaction,
  getAllTickets, updateTicketStatus,
  adminGetFaqs, createFaq, updateFaq, deleteFaq,
  getStats,
  getPendingAdmins, reviewAdminRequest,
} = require('../controllers/adminController');

router.use(adminProtect);

// Dashboard
router.get('/stats', getStats);

// Pending Admin Requests
router.get('/pending-admins', getPendingAdmins);
router.put('/pending-admins/:id', reviewAdminRequest);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);

// Onboarding
router.get('/onboarding', getPendingDocuments);
router.put('/onboarding/:docId', reviewDocument);

// Transactions
router.get('/transactions', getAllTransactions);
router.post('/transactions', createTransaction);

// Support Tickets
router.get('/tickets', getAllTickets);
router.put('/tickets/:id', updateTicketStatus);

// FAQs
router.get('/faqs', adminGetFaqs);
router.post('/faqs', createFaq);
router.put('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);

module.exports = router;