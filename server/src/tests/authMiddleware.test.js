/**
 * Unit tests for authMiddleware
 *
 * Validates: Requirements 2.4, 2.5
 */

const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

const TEST_SECRET = 'test-secret-for-middleware-tests';
const TEST_USER_ID = 'user-abc-123';

// Helper to build mock req/res/next
function buildMocks({ authHeader } = {}) {
  const req = {
    headers: authHeader !== undefined ? { authorization: authHeader } : {},
  };

  const res = {
    _status: null,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
  };

  const next = jest.fn();

  return { req, res, next };
}

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

afterAll(() => {
  delete process.env.JWT_SECRET;
});

// ── Valid token ────────────────────────────────────────────────────────────────

describe('authMiddleware — valid token', () => {
  test('calls next() and sets req.userId when token is valid', () => {
    const token = jwt.sign({ sub: TEST_USER_ID }, TEST_SECRET, { expiresIn: '1h' });
    const { req, res, next } = buildMocks({ authHeader: `Bearer ${token}` });

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe(TEST_USER_ID);
    expect(res._status).toBeNull(); // no error response sent
  });
});

// ── Expired token ──────────────────────────────────────────────────────────────

describe('authMiddleware — expired token', () => {
  test('returns 401 when token is expired', () => {
    // expiresIn: 0 creates a token that is immediately expired
    const token = jwt.sign({ sub: TEST_USER_ID }, TEST_SECRET, { expiresIn: 0 });
    const { req, res, next } = buildMocks({ authHeader: `Bearer ${token}` });

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('error');
  });
});

// ── Missing Authorization header ───────────────────────────────────────────────

describe('authMiddleware — missing Authorization header', () => {
  test('returns 401 when Authorization header is absent', () => {
    const { req, res, next } = buildMocks(); // no authHeader

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('error');
  });

  test('returns 401 when Authorization header is an empty string', () => {
    const { req, res, next } = buildMocks({ authHeader: '' });

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('error');
  });
});

// ── Tampered / invalid token ───────────────────────────────────────────────────

describe('authMiddleware — tampered or invalid token', () => {
  test('returns 401 for a completely invalid token string', () => {
    const { req, res, next } = buildMocks({ authHeader: 'Bearer not.a.valid.jwt' });

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('error');
  });

  test('returns 401 when the token payload has been tampered with', () => {
    const token = jwt.sign({ sub: TEST_USER_ID }, TEST_SECRET, { expiresIn: '1h' });
    // Tamper with the payload section (index 1 of the three JWT parts)
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'hacker-id' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const { req, res, next } = buildMocks({ authHeader: `Bearer ${tamperedToken}` });

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('error');
  });
});

// ── Wrong secret ───────────────────────────────────────────────────────────────

describe('authMiddleware — token signed with wrong secret', () => {
  test('returns 401 when token was signed with a different secret', () => {
    const token = jwt.sign({ sub: TEST_USER_ID }, 'completely-different-secret', { expiresIn: '1h' });
    const { req, res, next } = buildMocks({ authHeader: `Bearer ${token}` });

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('error');
  });
});
