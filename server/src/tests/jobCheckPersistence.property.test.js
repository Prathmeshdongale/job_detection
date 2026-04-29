// Feature: job-fraud-detection, Property 8: JobCheck persistence is complete and consistent

/**
 * Property-Based Test for JobCheck persistence completeness
 *
 * Property 8: JobCheck persistence is complete and consistent
 * Validates: Requirements 3.5, 9.2, 10.2
 */

const fc = require('fast-check');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const JobCheck = require('../models/JobCheck');
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

describe('JobCheck — Property 8: JobCheck persistence is complete and consistent', () => {
  /**
   * **Validates: Requirements 3.5, 9.2, 10.2**
   *
   * For any inputText and scamProbability, a persisted JobCheck document must:
   * - Contain all required fields: _id, userId, inputText, scamProbability, riskLabel, suspiciousPhrases, source, createdAt
   * - Have riskLabel === computeRiskLabel(scamProbability)
   * - Have userId matching the one used to create it
   */
  test('persisted document contains all required fields and is internally consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        async (inputText, scamProbability) => {
          const userId = new mongoose.Types.ObjectId();
          const riskLabel = computeRiskLabel(scamProbability);

          const created = await JobCheck.create({
            userId,
            inputText,
            scamProbability,
            riskLabel,
            suspiciousPhrases: [],
            source: 'manual',
            createdAt: new Date(),
          });

          const doc = await JobCheck.findById(created._id).lean();

          // All required fields must be present
          const hasAllFields =
            doc._id !== undefined &&
            doc.userId !== undefined &&
            doc.inputText !== undefined &&
            doc.scamProbability !== undefined &&
            doc.riskLabel !== undefined &&
            doc.suspiciousPhrases !== undefined &&
            doc.source !== undefined &&
            doc.createdAt !== undefined;

          // riskLabel must match computeRiskLabel(scamProbability)
          const labelConsistent = doc.riskLabel === computeRiskLabel(doc.scamProbability);

          // userId must match the one used to create the document
          const userIdMatches = doc.userId.toString() === userId.toString();

          return hasAllFields && labelConsistent && userIdMatches;
        }
      ),
      { numRuns: 100 }
    );
  });
});
