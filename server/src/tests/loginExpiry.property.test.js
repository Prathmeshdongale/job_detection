// Feature: job-fraud-detection, Property 5: Login returns a JWT with a 24-hour expiry

/**
 * Property-Based Test for JWT expiry on login
 *
 * Property 5: Login returns a JWT with a 24-hour expiry
 * Validates: Requirements 2.2
 *
 * Strategy:
 *   - Spin up an in-memory MongoDB via mongodb-memory-server
 *   - For each generated (username, email, password) triple, register the user via POST /api/auth/register
 *   - Call POST /api/auth/login with the same credentials
 *   - Decode the returned JWT (without verifying the signature) and assert exp - iat === 86400
 */

const fc = require('fast-check');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../index');

const TEST_SECRET = 'test-secret-login-expiry';

let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Disconnect any existing connection, then connect to the in-memory instance
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);

  // Set JWT secret for the duration of the test suite
  process.env.JWT_SECRET = TEST_SECRET;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  delete process.env.JWT_SECRET;
});

afterEach(async () => {
  // Clear the users collection between runs to avoid duplicate-key errors
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Login — Property 5: Login returns a JWT with a 24-hour expiry', () => {
  test(
    'for any registered user with valid credentials, exp - iat === 86400',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate unique-enough usernames (alphanumeric, 6-16 chars)
          fc.stringMatching(/^[a-z][a-z0-9]{5,15}$/),
          // Generate valid-looking email addresses
          fc.stringMatching(/^[a-z][a-z0-9]{3,8}@[a-z]{3,6}\.[a-z]{2,4}$/),
          // Generate passwords of at least 8 characters
          fc.string({ minLength: 8, maxLength: 32 }).filter((p) => p.trim().length >= 8),
          async (username, email, password) => {
            // Step 1: Register the user
            const registerRes = await request(app)
              .post('/api/auth/register')
              .send({ username, email, password });

            // If registration fails (e.g. duplicate from a previous run), skip this sample
            if (registerRes.status !== 201) {
              return true;
            }

            // Step 2: Login with the same credentials
            const loginRes = await request(app)
              .post('/api/auth/login')
              .send({ email, password });

            if (loginRes.status !== 200) {
              return false;
            }

            const { token } = loginRes.body;
            if (!token) {
              return false;
            }

            // Step 3: Decode (not verify) the JWT and check expiry window
            const decoded = jwt.decode(token);
            if (!decoded || typeof decoded.exp !== 'number' || typeof decoded.iat !== 'number') {
              return false;
            }

            return decoded.exp - decoded.iat === 86400;
          }
        ),
        { numRuns: 100 }
      );
    },
    // Generous timeout: 100 runs each involving bcrypt + DB ops
    120000
  );
});
