const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const BCRYPT_COST = 10;

/**
 * POST /api/auth/register
 * Validates input, hashes password, creates User document, returns signed JWT.
 */
async function register(req, res) {
  const { username, email, password } = req.body;

  // Validate required fields
  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  // Validate password length
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    // Create user document
    const user = await User.create({ username, email, passwordHash });

    // Build JWT payload
    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      iat,
      exp: iat + 86400,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256' });

    return res.status(201).json({ token });
  } catch (err) {
    // MongoDB duplicate key error code
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error('register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/login
 * Validates credentials, returns signed JWT on success.
 */
async function login(req, res) {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Look up user by email
    const user = await User.findOne({ email });

    // Return generic 401 for unrecognised email (do not distinguish from wrong password)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare provided password against stored hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Build JWT payload with 24-hour expiry
    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      iat,
      exp: iat + 86400,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256' });

    return res.status(200).json({ token });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { register, login };
