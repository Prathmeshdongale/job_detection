/**
 * Unit tests for predictController (POST /api/predict)
 *
 * Validates: Requirements 3.2, 3.5, 9.1, 9.4
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const axios = require('axios');

jest.mock('axios');

const { app } = require('../index');
const JobCheck = require('../models/JobCheck');

let mongoServer;
let authToken;
let userId;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-predict';
  process.env.AI_SERVICE_URL = 'http://fake-ai-service';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create a fake userId and sign a valid JWT
  userId = new mongoose.Types.ObjectId().toString();
  authToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear JobChecks between tests
  await JobCheck.deleteMany({});
  jest.resetAllMocks();
});

// ── Success path ───────────────────────────────────────────────────────────────

describe('POST /api/predict — success', () => {
  test('AI service success → persists JobCheck and returns 200 with correct shape', async () => {
    axios.post.mockResolvedValue({
      status: 200,
      data: {
        scam_probability: 0.85,
        suspicious_phrases: ['work from home', 'no experience needed']
      }
    });

    const res = await request(app)
      .post('/api/predict')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'Earn $5000 a week working from home, no experience needed!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('scam_probability', 0.85);
    expect(res.body).toHaveProperty('suspicious_phrases');
    expect(res.body.suspicious_phrases).toEqual(['work from home', 'no experience needed']);
    expect(res.body).toHaveProperty('checkId');
    expect(res.body).toHaveProperty('riskLabel', 'High Risk');

    // Verify the record was persisted in MongoDB
    const saved = await JobCheck.findById(res.body.checkId);
    expect(saved).not.toBeNull();
    expect(saved.scamProbability).toBe(0.85);
    expect(saved.riskLabel).toBe('High Risk');
    expect(saved.inputText).toBe('Earn $5000 a week working from home, no experience needed!');
    expect(saved.userId.toString()).toBe(userId);
  });
});

// ── Error paths ────────────────────────────────────────────────────────────────

describe('POST /api/predict — AI service errors', () => {
  test('AI service timeout (ECONNABORTED) → 504', async () => {
    const timeoutError = new Error('timeout of 5000ms exceeded');
    timeoutError.code = 'ECONNABORTED';
    axios.post.mockRejectedValue(timeoutError);

    const res = await request(app)
      .post('/api/predict')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'Some job posting text' });

    expect(res.status).toBe(504);
    expect(res.body).toHaveProperty('error');
  });

  test('AI service 500 error → 503', async () => {
    const serverError = new Error('Request failed with status code 500');
    serverError.response = { status: 500 };
    axios.post.mockRejectedValue(serverError);

    const res = await request(app)
      .post('/api/predict')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'Some job posting text' });

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('error');
  });
});

// ── Validation errors ──────────────────────────────────────────────────────────

describe('POST /api/predict — input validation', () => {
  test('missing text field → 400', async () => {
    const res = await request(app)
      .post('/api/predict')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('empty text field → 400', async () => {
    const res = await request(app)
      .post('/api/predict')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
