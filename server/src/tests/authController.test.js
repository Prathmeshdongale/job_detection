/**
 * Unit tests for auth controller endpoints
 *
 * Validates: Requirements 1.2, 1.3, 1.4, 2.2, 2.3
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../index');

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear users between tests to keep them isolated
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Registration tests ─────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('valid registration returns 201 with a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'securepass' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  test('duplicate email returns 409', async () => {
    // Register once
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob', email: 'bob@example.com', password: 'securepass' });

    // Register again with same email but different username
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob2', email: 'bob@example.com', password: 'securepass' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('password shorter than 8 characters returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'charlie', email: 'charlie@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('missing username returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nouser@example.com', password: 'securepass' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('missing email returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'dave', password: 'securepass' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ── Login tests ────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Seed a user for login tests
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'eve', email: 'eve@example.com', password: 'correctpass' });
  });

  test('valid login returns 200 with a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'eve@example.com', password: 'correctpass' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  test('wrong password returns 401 with generic message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'eve@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('unknown email returns 401 with the same generic message as wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'somepassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    // Must be indistinguishable from wrong-password response
    expect(res.body.error).toBe('Invalid email or password');
  });
});
