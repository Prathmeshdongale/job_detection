const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { handlePredict, createShareLink, getSharedCheck } = require('../controllers/predictController');
const { handleBatchPredict } = require('../controllers/batchController');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public shared result — no auth
router.get('/shared/:token', getSharedCheck);

// Authenticated routes
router.post('/', authMiddleware, handlePredict);
router.post('/batch', upload, handleUploadError, authMiddleware, handleBatchPredict);
router.post('/:id/share', authMiddleware, createShareLink);

module.exports = router;
