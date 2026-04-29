const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const nock = require('nock');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'integration-test-secret';

const { app } = require('../../src/index');
const JobCheck = require('../../src/models/JobCheck');

let mongod;
let token;
let userId;

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  userId = new mongoose.Types.ObjectId();
  token = jwt.sign(
    { sub: userId.toString(), username: 'testuser' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: 86400 }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  nock.cleanAll();
});

afterEach(async () => {
  await JobCheck.deleteMany({});
  nock.cleanAll();
});

describe('POST /api/predict integration', () => {
  it('submits text → JobCheck persisted with all required fields', async () => {
    nock(AI_URL)
      .post('/predict')
      .reply(200, { scam_probability: 0.82, suspicious_phrases: ['work from home'] });

    const res = await request(app)
      .post('/api/predict')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Earn money fast working from home' })
      .expect(200);

    expect(res.body.scam_probability).toBe(0.82);
    expect(res.body.riskLabel).toBe('High Risk');
    expect(res.body.checkId).toBeDefined();

    // Verify persisted in MongoDB
    const doc = await JobCheck.findById(res.body.checkId);
    expect(doc).not.toBeNull();
    expect(doc.inputText).toBe('Earn money fast working from home');
    expect(doc.scamProbability).toBe(0.82);
    expect(doc.riskLabel).toBe('High Risk');
    expect(doc.suspiciousPhrases).toContain('work from home');
    expect(doc.source).toBe('manual');
    expect(doc.userId.toString()).toBe(userId.toString());
  });

  it('returns 400 for missing text', async () => {
    await request(app)
      .post('/api/predict')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
  });
});
