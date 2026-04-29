// Feature: job-fraud-detection, Property 12: CSV batch produces one JobCheck per valid row
// Feature: job-fraud-detection, Property 13: CSV parsing is a round-trip — extracted texts match CSV content

/**
 * Property-Based Tests for CSV batch upload
 *
 * Property 12: CSV batch produces one JobCheck per valid row
 * Validates: Requirements 4.3, 4.5
 *
 * Property 13: CSV parsing is a round-trip — extracted texts match CSV content
 * Validates: Requirements 4.2
 */

const fc = require('fast-check');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { parse } = require('csv-parse/sync');

jest.mock('axios');

const { app } = require('../index');
const JobCheck = require('../models/JobCheck');

let mongoServer;
let authToken;
let userId;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-csv-batch';
  process.env.AI_SERVICE_URL = 'http://fake-ai-service';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  userId = new mongoose.Types.ObjectId().toString();
  authToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await JobCheck.deleteMany({});
  jest.resetAllMocks();
});

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Build a CSV buffer from an array of description strings (may be empty).
 */
function buildCsvBuffer(descriptions) {
  const header = 'description';
  const rows = descriptions.map(d => {
    // Escape double-quotes and wrap in quotes to handle commas/newlines
    const escaped = d.replace(/"/g, '""');
    return `"${escaped}"`;
  });
  return Buffer.from([header, ...rows].join('\n'), 'utf8');
}

// ── Property 12 ────────────────────────────────────────────────────────────────

describe('Property 12: CSV batch produces one JobCheck per valid row', () => {
  /**
   * **Validates: Requirements 4.3, 4.5**
   *
   * For any CSV with V valid rows and S skipped (empty) rows:
   *   results.length === V  and  warnings.length === S
   */
  test('results.length === validCount and warnings.length === skipCount', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(
            // valid description: non-empty, non-whitespace-only string
            fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            // empty/blank description (will be skipped)
            fc.constantFrom('', '   ', '\t', '\n')
          ),
          { minLength: 1, maxLength: 30 }
        ),
        async (descriptions) => {
          const validCount = descriptions.filter(d => d.trim().length > 0).length;
          const skipCount = descriptions.length - validCount;

          // Mock axios to return a successful AI response for each valid row
          axios.post.mockResolvedValue({
            status: 200,
            data: { scam_probability: 0.5, suspicious_phrases: [] }
          });

          const csvBuffer = buildCsvBuffer(descriptions);

          const res = await request(app)
            .post('/api/predict/batch')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', csvBuffer, { filename: 'test.csv', contentType: 'text/csv' });

          if (res.status !== 200) return false;

          const { results, warnings } = res.body;
          return results.length === validCount && warnings.length === skipCount;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 13 ────────────────────────────────────────────────────────────────

describe('Property 13: CSV parsing is a round-trip — extracted texts match CSV content', () => {
  /**
   * **Validates: Requirements 4.2**
   *
   * For any array of non-empty description strings, building a CSV and parsing
   * it back with csv-parse/sync must yield exactly the original strings —
   * no truncation, no corruption.
   */
  test('parsed descriptions match source values exactly', () => {
    fc.assert(
      fc.property(
        fc.array(
          // Generate printable ASCII strings that are safe in CSV
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 50 }
        ),
        (descriptions) => {
          const csvString = ['description', ...descriptions.map(d => `"${d.replace(/"/g, '""')}"`)]
            .join('\n');

          const rows = parse(csvString, { columns: true, skip_empty_lines: true });

          if (rows.length !== descriptions.length) return false;

          return rows.every((row, i) => {
            const descKey = Object.keys(row).find(k => k.toLowerCase() === 'description');
            const extracted = descKey ? row[descKey] : Object.values(row)[0];
            return extracted === descriptions[i];
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
