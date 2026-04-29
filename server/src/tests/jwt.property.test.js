// Feature: job-fraud-detection, Property 4: JWT access control is enforced on all protected endpoints

/**
 * Property-Based Test for JWT access control
 *
 * Property 4: JWT access control is enforced on all protected endpoints
 * Validates: Requirements 2.4, 2.5
 *
 * Strategy:
 *   - Build a minimal Express app with a single protected route using authMiddleware
 *   - Generate valid JWTs signed with the test secret → expect 200
 *   - Generate malformed strings (random, empty, "Bearer xxx") → expect 401
 *   - Generate expired JWTs (exp in the past) → expect 401
 *   - Assert the two conditions hold simultaneously (no token is both accepted and rejected)
 */

const fc = require('fast-check');
const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');
const authMiddleware = require('../middleware/authMiddleware');

const TEST_SECRET = 'test-secret-for-property-tests';

// ── Minimal test app ──────────────────────────────────────────────────────────
function buildTestApp(secret) {
  const app = express();
  app.use(express.json());

  // Override JWT_SECRET for this test app
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = secret;

  app.get('/protected', authMiddleware, (req, res) => {
    res.status(200).json({ userId: req.userId });
  });

  // Restore after route registration (middleware reads env at call time)
  // We keep it set for the duration of the test suite.

  return app;
}

// ── Token generators ──────────────────────────────────────────────────────────

/** Create a valid JWT (exp 1 hour from now) */
function makeValidToken(userId, secret) {
  const iat = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { sub: userId, username: 'testuser', iat, exp: iat + 3600 },
    secret,
    { algorithm: 'HS256' }
  );
}

/** Create an expired JWT (exp 1 hour in the past) */
function makeExpiredToken(userId, secret) {
  const iat = Math.floor(Date.now() / 1000) - 7200; // issued 2h ago
  return jwt.sign(
    { sub: userId, username: 'testuser', iat, exp: iat + 3600 }, // expired 1h ago
    secret,
    { algorithm: 'HS256' }
  );
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('JWT — Property 4: JWT access control is enforced on all protected endpoints', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    app = buildTestApp(TEST_SECRET);
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  // ── Valid tokens → 200 ──────────────────────────────────────────────────────
  test('valid JWTs signed with the correct secret are granted access (non-401)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a userId-like string (non-empty alphanumeric)
        fc.hexaString({ minLength: 24, maxLength: 24 }),
        async (userId) => {
          const token = makeValidToken(userId, TEST_SECRET);
          const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
          return res.status !== 401;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Malformed tokens → 401 ─────────────────────────────────────────────────
  test('random malformed strings in Authorization header return 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary strings that are NOT valid JWTs
        fc.string({ minLength: 0, maxLength: 200 }),
        async (randomString) => {
          const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${randomString}`);
          return res.status === 401;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Missing Authorization header → 401 ────────────────────────────────────
  test('requests with no Authorization header return 401', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  // ── Empty Bearer token → 401 ───────────────────────────────────────────────
  test('requests with empty Bearer token return 401', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });

  // ── Expired tokens → 401 ──────────────────────────────────────────────────
  test('expired JWTs return 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 24, maxLength: 24 }),
        async (userId) => {
          const token = makeExpiredToken(userId, TEST_SECRET);
          const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
          return res.status === 401;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Tokens signed with wrong secret → 401 ─────────────────────────────────
  test('JWTs signed with a different secret return 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 24, maxLength: 24 }),
        // Generate a different secret (non-empty, not equal to TEST_SECRET)
        fc.string({ minLength: 8, maxLength: 64 }).filter((s) => s !== TEST_SECRET),
        async (userId, wrongSecret) => {
          const token = makeValidToken(userId, wrongSecret);
          const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
          return res.status === 401;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Mutual exclusion: no token is both accepted and rejected ───────────────
  test('valid and invalid tokens never produce the same access outcome (mutual exclusion)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 24, maxLength: 24 }),
        async (userId) => {
          const validToken = makeValidToken(userId, TEST_SECRET);
          const expiredToken = makeExpiredToken(userId, TEST_SECRET);

          const [validRes, expiredRes] = await Promise.all([
            request(app).get('/protected').set('Authorization', `Bearer ${validToken}`),
            request(app).get('/protected').set('Authorization', `Bearer ${expiredToken}`),
          ]);

          // Valid must be non-401, expired must be 401 — they must differ
          const validAccepted = validRes.status !== 401;
          const expiredRejected = expiredRes.status === 401;

          return validAccepted && expiredRejected;
        }
      ),
      { numRuns: 100 }
    );
  });
});
