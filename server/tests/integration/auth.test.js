const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Must be set before requiring app so authController picks it up
process.env.JWT_SECRET = 'integration-test-secret';

const { app } = require('../../src/index');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const VALID_USER = {
  username: 'integrationuser',
  email: 'integration@test.com',
  password: 'password123',
};

describe('Auth integration flow', () => {
  it('register → login → access protected route', async () => {
    // 1. Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(VALID_USER)
      .expect(201);

    expect(regRes.body.token).toBeDefined();

    // 2. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password })
      .expect(200);

    const { token } = loginRes.body;
    expect(token).toBeDefined();

    // Verify 24-hour expiry
    const decoded = jwt.decode(token);
    expect(decoded.exp - decoded.iat).toBe(86400);

    // 3. Access protected route with valid token
    const healthRes = await request(app)
      .get('/api/checks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(healthRes.body.checks).toBeDefined();
  });

  it('expired token is rejected with 401', async () => {
    // Create an already-expired token
    const expiredToken = jwt.sign(
      { sub: new mongoose.Types.ObjectId().toString(), username: 'x' },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );

    await request(app)
      .get('/api/checks')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('missing token returns 401', async () => {
    await request(app).get('/api/checks').expect(401);
  });
});
