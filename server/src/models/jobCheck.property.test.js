// Feature: job-fraud-detection, Property 2: Risk label and scam probability are consistent in every persisted JobCheck

/**
 * Property-Based Test for persisted JobCheck label consistency
 *
 * Property 2: Risk label and scam probability are consistent in every persisted JobCheck
 * Validates: Requirements 3.5, 9.2, 10.2
 */

const fc = require('fast-check');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const JobCheck = require('./JobCheck');
const { computeRiskLabel } = require('../utils/riskLabel');

let mongoServer;

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
});

describe('JobCheck — Property 2: Risk label and scam probability are consistent in every persisted JobCheck', () => {
  test('fetched riskLabel always matches computeRiskLabel(scamProbability) for any score in [0, 1]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0, max: 1 }),
        async (score) => {
          const riskLabel = computeRiskLabel(score);

          const created = await JobCheck.create({
            userId: new mongoose.Types.ObjectId(),
            inputText: 'Sample job description for property test',
            scamProbability: score,
            riskLabel,
            source: 'manual',
          });

          const fetched = await JobCheck.findById(created._id).lean();

          return fetched.riskLabel === computeRiskLabel(fetched.scamProbability);
        }
      ),
      { numRuns: 100 }
    );
  });
});
