const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register — task 3.2
router.post('/register', register);

// POST /api/auth/login — task 3.3
router.post('/login', login);

module.exports = router;
