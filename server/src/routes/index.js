const express = require('express');
const authRouter = require('./auth');
const predictRouter = require('./predict');
const checksRouter = require('./checks');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/predict', predictRouter);
router.use('/checks', checksRouter);

router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;
