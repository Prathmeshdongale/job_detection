const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getProfile, changePassword, deleteAccount } = require('../controllers/userController');

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/password', authMiddleware, changePassword);
router.delete('/account', authMiddleware, deleteAccount);

module.exports = router;
