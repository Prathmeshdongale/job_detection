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
    { sub: userId.toString(), username: 'batchuser' },
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

function mockAI(times = 1) {
  for (let i = 0; i < times; i++) {
    nock(AI_URL)
      .post('/predict')
      .reply(200, { scam_probability: 0.5, suspicious_phrases: [] });
  }
}

describe('POST /api/predict/batch integration', () => {
  it('3-row CSV → 3 JobChecks persisted', async () => {
    mockAI(3);
    const csv = 'description\nJob one description\nJob two description\nJob three description\n';
    const buf = Buffer.from(csv);

    const res = await request(app)
      .post('/api/predict/batch')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buf, { filename: 'jobs.csv', contentType: 'text/csv' })
      .expect(200);

    expect(res.body.results).toHaveLength(3);
    expect(res.body.warnings).toHaveLength(0);

    const count = await JobCheck.countDocuments({ userId });
    expect(count).toBe(3);
  });

  it('CSV with 1 empty row → 2 checks + 1 warning', async () => {
    mockAI(2);
    const csv = 'description\nJob one description\n\nJob three description\n';
    const buf = Buffer.from(csv);

    const res = await request(app)
      .post('/api/predict/batch')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buf, { filename: 'jobs.csv', contentType: 'text/csv' })
      .expect(200);

    expect(res.body.results).toHaveLength(2);
    expect(res.body.warnings).toHaveLength(1);

    const count = await JobCheck.countDocuments({ userId });
    expect(count).toBe(2);
  });
});
