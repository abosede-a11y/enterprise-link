const express = require('express');
const router = express.Router();
const { getAllFaqs, getFaqById, addBookmark, removeBookmark, getBookmarks } = require('../controllers/faqController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getAllFaqs);
router.get('/bookmarks', protect, getBookmarks);
router.get('/:id', getFaqById);
router.post('/:id/bookmark', protect, addBookmark);
router.delete('/:id/bookmark', protect, removeBookmark);

module.exports = router;
