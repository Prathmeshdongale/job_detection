require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const authRouter = require('./routes/auth');
const predictRouter = require('./routes/predict');
const checksRouter = require('./routes/checks');
const userRouter = require('./routes/user');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// ── Security & utility middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// ── Rate limiting ──────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const predictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many prediction requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/predict', predictLimiter, predictRouter);
app.use('/api/checks', checksRouter);
app.use('/api/user', userRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── Global error handler ───────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── MongoDB connection ─────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://prathmeshdongale04:Patya2210@cluster0.z4m1qiy.mongodb.net/job_detection?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

// ── Start server (only when this file is run directly, not during tests) ───────
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  });
}

module.exports = { app, connectDB };
