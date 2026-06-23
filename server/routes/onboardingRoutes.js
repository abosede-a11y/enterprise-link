const express = require('express');
const router = express.Router();
const { uploadDocument, getProgress } = require('../controllers/onboardingController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(protect);
router.post('/upload', upload.single('document'), uploadDocument);
router.get('/progress', getProgress);

module.exports = router;
