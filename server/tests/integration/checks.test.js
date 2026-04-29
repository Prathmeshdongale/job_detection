const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'integration-test-secret';

const { app } = require('../../src/index');
const JobCheck = require('../../src/models/JobCheck');

const JWT_SECRET = process.env.JWT_SECRET;

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  userIdA = new mongoose.Types.ObjectId();
  userIdB = new mongoose.Types.ObjectId();

  tokenA = jwt.sign({ sub: userIdA.toString(), username: 'userA' }, JWT_SECRET, { expiresIn: 86400 });
  tokenB = jwt.sign({ sub: userIdB.toString(), username: 'userB' }, JWT_SECRET, { expiresIn: 86400 });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await JobCheck.deleteMany({});
});

async function seedChecks(userId, count) {
  const docs = [];
  for (let i = 0; i < count; i++) {
    docs.push({
      userId,
      inputText: `Job description ${i}`,
      scamProbability: 0.5,
      riskLabel: 'Medium Risk',
      suspiciousPhrases: [],
      source: 'manual',
      createdAt: new Date(Date.now() - i * 1000),
    });
  }
  await JobCheck.insertMany(docs);
}

describe('GET /api/checks pagination', () => {
  it('25 checks → page 1 returns 20, page 2 returns 5', async () => {
    await seedChecks(userIdA, 25);

    const page1 = await request(app)
      .get('/api/checks?page=1&limit=20')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(page1.body.checks).toHaveLength(20);
    expect(page1.body.pagination.total).toBe(25);

    const page2 = await request(app)
      .get('/api/checks?page=2&limit=20')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(page2.body.checks).toHaveLength(5);
  });
});

describe('Ownership enforcement', () => {
  it('user A cannot delete user B\'s check (403)', async () => {
    await seedChecks(userIdB, 1);
    const checkB = await JobCheck.findOne({ userId: userIdB });

    await request(app)
      .delete(`/api/checks/${checkB._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);
  });

  it('user A can delete their own check (204)', async () => {
    await seedChecks(userIdA, 1);
    const checkA = await JobCheck.findOne({ userId: userIdA });

    await request(app)
      .delete(`/api/checks/${checkA._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(204);
  });
});
