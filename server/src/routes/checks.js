const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getChecks, deleteCheck, exportChecks, getAnalytics } = require('../controllers/checksController');

const router = express.Router();

router.get('/export', authMiddleware, exportChecks);
router.get('/analytics', authMiddleware, getAnalytics);
router.get('/', authMiddleware, getChecks);
router.delete('/:id', authMiddleware, deleteCheck);

module.exports = router;
