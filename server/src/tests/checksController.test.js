const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const { app } = require('../index');
const JobCheck = require('../models/JobCheck');
const User = require('../models/User');

let mongoServer;
let testUserId;
let testToken;
let otherUserId;
let otherToken;

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create test users
  const testUser = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashedpassword'
  });
  testUserId = testUser._id.toString();
  testToken = jwt.sign({ sub: testUserId, username: 'testuser' }, JWT_SECRET, { expiresIn: '24h' });

  const otherUser = await User.create({
    username: 'otheruser',
    email: 'other@example.com',
    passwordHash: 'hashedpassword'
  });
  otherUserId = otherUser._id.toString();
  otherToken = jwt.sign({ sub: otherUserId, username: 'otheruser' }, JWT_SECRET, { expiresIn: '24h' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await JobCheck.deleteMany({});
});

describe('GET /api/checks', () => {
  test('returns empty array when user has no checks', async () => {
    const res = await request(app)
      .get('/api/checks')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.checks).toEqual([]);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 0
    });
  });

  test('returns checks for authenticated user only', async () => {
    // Create checks for test user
    await JobCheck.create({
      userId: testUserId,
      inputText: 'Test job 1',
      scamProbability: 0.5,
      riskLabel: 'Medium Risk',
      source: 'manual'
    });

    await JobCheck.create({
      userId: testUserId,
      inputText: 'Test job 2',
      scamProbability: 0.8,
      riskLabel: 'High Risk',
      source: 'manual'
    });

    // Create check for other user
    await JobCheck.create({
      userId: otherUserId,
      inputText: 'Other user job',
      scamProbability: 0.3,
      riskLabel: 'Low Risk',
      source: 'manual'
    });

    const res = await request(app)
      .get('/api/checks')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.checks).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.checks[0].inputText).toBe('Test job 2'); // Most recent first
    expect(res.body.checks[1].inputText).toBe('Test job 1');
  });

  test('supports pagination with page and limit parameters', async () => {
    // Create 25 checks
    for (let i = 0; i < 25; i++) {
      await JobCheck.create({
        userId: testUserId,
        inputText: `Test job ${i}`,
        scamProbability: 0.5,
        riskLabel: 'Medium Risk',
        source: 'manual'
      });
    }

    // Get page 1 with limit 10
    const res1 = await request(app)
      .get('/api/checks?page=1&limit=10')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.checks).toHaveLength(10);
    expect(res1.body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 25
    });

    // Get page 2 with limit 10
    const res2 = await request(app)
      .get('/api/checks?page=2&limit=10')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.checks).toHaveLength(10);
    expect(res2.body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25
    });

    // Get page 3 with limit 10
    const res3 = await request(app)
      .get('/api/checks?page=3&limit=10')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res3.status).toBe(200);
    expect(res3.body.checks).toHaveLength(5);
    expect(res3.body.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 25
    });
  });

  test('enforces maximum limit of 100', async () => {
    const res = await request(app)
      .get('/api/checks?limit=200')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(100);
  });

  test('returns 401 without valid JWT', async () => {
    const res = await request(app)
      .get('/api/checks');

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/checks/:id', () => {
  test('deletes check owned by authenticated user', async () => {
    const check = await JobCheck.create({
      userId: testUserId,
      inputText: 'Test job',
      scamProbability: 0.5,
      riskLabel: 'Medium Risk',
      source: 'manual'
    });

    const res = await request(app)
      .delete(`/api/checks/${check._id}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(204);

    // Verify check is deleted
    const deletedCheck = await JobCheck.findById(check._id);
    expect(deletedCheck).toBeNull();
  });

  test('returns 404 when check does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/checks/${fakeId}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Check not found');
  });

  test('returns 403 when trying to delete another user\'s check', async () => {
    const check = await JobCheck.create({
      userId: otherUserId,
      inputText: 'Other user job',
      scamProbability: 0.5,
      riskLabel: 'Medium Risk',
      source: 'manual'
    });

    const res = await request(app)
      .delete(`/api/checks/${check._id}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');

    // Verify check still exists
    const stillExists = await JobCheck.findById(check._id);
    expect(stillExists).not.toBeNull();
  });

  test('returns 401 without valid JWT', async () => {
    const check = await JobCheck.create({
      userId: testUserId,
      inputText: 'Test job',
      scamProbability: 0.5,
      riskLabel: 'Medium Risk',
      source: 'manual'
    });

    const res = await request(app)
      .delete(`/api/checks/${check._id}`);

    expect(res.status).toBe(401);
  });
});
