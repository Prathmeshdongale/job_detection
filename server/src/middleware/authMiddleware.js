const jwt = require('jsonwebtoken');

/**
 * Auth middleware — verifies the Bearer JWT in the Authorization header.
 *
 * On success: attaches req.userId (string) and calls next().
 * On failure: returns HTTP 401 with a descriptive error message.
 *
 * Requirements: 2.4, 2.5
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'test-secret';
    const payload = jwt.verify(token, secret);
    req.userId = payload.sub;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
