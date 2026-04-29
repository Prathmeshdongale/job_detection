// Feature: job-fraud-detection, Property 9: Pagination is complete and ordered
// Feature: job-fraud-detection, Property 10: Ownership enforcement — users cannot access each other's checks
// Feature: job-fraud-detection, Property 11: Delete is a round-trip — deleted checks no longer exist

/**
 * Property-Based Tests for Checks API
 *
 * Property 9: Pagination is complete and ordered
 * Validates: Requirements 7.1, 7.3
 *
 * Property 10: Ownership enforcement — users cannot access each other's checks
 * Validates: Requirements 7.6
 *
 * Property 11: Delete is a round-trip — deleted checks no longer exist
 * Validates: Requirements 7.5
 */

const fc = require('fast-check');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const { app } = require('../index');
const JobCheck = require('../models/JobCheck');
const User = require('../models/User');

let mongoServer;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await JobCheck.deleteMany({});
  await User.deleteMany({});
});

describe('Checks API — Property 9: Pagination is complete and ordered', () => {
  /**
   * **Validates: Requirements 7.1, 7.3**
   *
   * For any N (1-50) JobCheck documents created for a test user:
   * - Paginating through all pages with a random limit (5-20) must collect all IDs
   * - Total count must equal N
   * - No duplicate IDs across pages
   * - createdAt order is descending across all pages
   */
  test('pagination collects all documents in descending createdAt order without duplicates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 5, max: 20 }),
        async (n, limit) => {
          // Create test user
          const user = await User.create({
            username: `user_${Date.now()}`,
            email: `user_${Date.now()}@example.com`,
            passwordHash: 'hashedpassword'
          });
          const userId = user._id.toString();
          const token = jwt.sign({ sub: userId, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

          // Create N JobCheck documents with slight time delays to ensure ordering
          const createdChecks = [];
          for (let i = 0; i < n; i++) {
            const check = await JobCheck.create({
              userId: user._id,
              inputText: `Job posting ${i}`,
              scamProbability: Math.random(),
              riskLabel: 'Medium Risk',
              suspiciousPhrases: [],
              source: 'manual',
              createdAt: new Date(Date.now() + i) // Ensure unique timestamps
            });
            createdChecks.push(check);
          }

          // Paginate through all pages
          const collectedIds = [];
          const collectedDates = [];
          let page = 1;
          let totalFromApi = 0;

          while (true) {
            const res = await request(app)
              .get(`/api/checks?page=${page}&limit=${limit}`)
              .set('Authorization', `Bearer ${token}`);

            if (res.status !== 200) {
              return false;
            }

            totalFromApi = res.body.pagination.total;
            const checks = res.body.checks;

            if (checks.length === 0) {
              break;
            }

            // Collect IDs and dates
            for (const check of checks) {
              collectedIds.push(check._id.toString());
              collectedDates.push(new Date(check.createdAt).getTime());
            }

            page++;
          }

          // Assert: total count === N
          const countMatches = totalFromApi === n;

          // Assert: no duplicate IDs
          const uniqueIds = new Set(collectedIds);
          const noDuplicates = uniqueIds.size === collectedIds.length;

          // Assert: all IDs collected
          const allCollected = collectedIds.length === n;

          // Assert: createdAt order is descending
          let isDescending = true;
          for (let i = 1; i < collectedDates.length; i++) {
            if (collectedDates[i] > collectedDates[i - 1]) {
              isDescending = false;
              break;
            }
          }

          return countMatches && noDuplicates && allCollected && isDescending;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Checks API — Property 10: Ownership enforcement', () => {
  /**
   * **Validates: Requirements 7.6**
   *
   * For any two distinct user IDs:
   * - User A cannot see User B's checks via GET /api/checks
   * - User A cannot delete User B's checks via DELETE /api/checks/:id (returns 403)
   */
  test('users cannot access each other\'s checks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        async (usernameA, usernameB) => {
          // Ensure distinct usernames
          if (usernameA === usernameB) {
            return true; // Skip this case
          }

          // Create user A
          const userA = await User.create({
            username: `userA_${usernameA}_${Date.now()}`,
            email: `userA_${usernameA}_${Date.now()}@example.com`,
            passwordHash: 'hashedpassword'
          });
          const userAId = userA._id.toString();
          const tokenA = jwt.sign({ sub: userAId, username: userA.username }, JWT_SECRET, { expiresIn: '24h' });

          // Create user B
          const userB = await User.create({
            username: `userB_${usernameB}_${Date.now()}`,
            email: `userB_${usernameB}_${Date.now()}@example.com`,
            passwordHash: 'hashedpassword'
          });
          const userBId = userB._id.toString();

          // Create a JobCheck for user B
          const checkB = await JobCheck.create({
            userId: userB._id,
            inputText: 'User B job posting',
            scamProbability: 0.7,
            riskLabel: 'High Risk',
            suspiciousPhrases: [],
            source: 'manual'
          });

          // User A calls GET /api/checks → should return empty array
          const getRes = await request(app)
            .get('/api/checks')
            .set('Authorization', `Bearer ${tokenA}`);

          const cannotSeeOtherChecks = getRes.status === 200 && getRes.body.checks.length === 0;

          // User A calls DELETE /api/checks/:id → should return 403
          const deleteRes = await request(app)
            .delete(`/api/checks/${checkB._id}`)
            .set('Authorization', `Bearer ${tokenA}`);

          const cannotDeleteOtherChecks = deleteRes.status === 403;

          // Verify check still exists
          const stillExists = await JobCheck.findById(checkB._id);
          const checkNotDeleted = stillExists !== null;

          return cannotSeeOtherChecks && cannotDeleteOtherChecks && checkNotDeleted;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Checks API — Property 11: Delete is a round-trip', () => {
  /**
   * **Validates: Requirements 7.5**
   *
   * For any owned JobCheck:
   * - DELETE /api/checks/:id returns 204
   * - Subsequent GET /api/checks/:id returns 404 or check is not found
   */
  test('deleted checks no longer exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        async (inputText, scamProbability) => {
          // Create test user
          const user = await User.create({
            username: `user_${Date.now()}`,
            email: `user_${Date.now()}@example.com`,
            passwordHash: 'hashedpassword'
          });
          const userId = user._id.toString();
          const token = jwt.sign({ sub: userId, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

          // Create a JobCheck
          const check = await JobCheck.create({
            userId: user._id,
            inputText,
            scamProbability,
            riskLabel: 'Medium Risk',
            suspiciousPhrases: [],
            source: 'manual'
          });

          // DELETE /api/checks/:id
          const deleteRes = await request(app)
            .delete(`/api/checks/${check._id}`)
            .set('Authorization', `Bearer ${token}`);

          const deleteSuccess = deleteRes.status === 204;

          // Verify check no longer exists in database
          const deletedCheck = await JobCheck.findById(check._id);
          const notFoundInDb = deletedCheck === null;

          // Verify GET /api/checks doesn't return the deleted check
          const getRes = await request(app)
            .get('/api/checks')
            .set('Authorization', `Bearer ${token}`);

          const notInList = getRes.status === 200 && 
            !getRes.body.checks.some(c => c._id.toString() === check._id.toString());

          return deleteSuccess && notFoundInDb && notInList;
        }
      ),
      { numRuns: 100 }
    );
  });
});
