// Feature: job-fraud-detection, Property 1: Risk label is consistent with scam probability

/**
 * Property-Based Test for computeRiskLabel
 *
 * Property 1: Risk label is consistent with scam probability
 * Validates: Requirements 5.2, 5.3, 5.4, 10.4
 */

const fc = require('fast-check');
const { computeRiskLabel } = require('./riskLabel');

describe('computeRiskLabel — Property 1: Risk label is consistent with scam probability', () => {
  test('label matches threshold rules for every generated score in [0, 1]', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1 }),
        (score) => {
          const label = computeRiskLabel(score);

          if (score >= 0.7) {
            return label === 'High Risk';
          }
          if (score >= 0.4) {
            return label === 'Medium Risk';
          }
          return label === 'Low Risk';
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('no score in [0, 1] produces undefined', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1 }),
        (score) => {
          const label = computeRiskLabel(score);
          return label !== undefined && label !== null;
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('every score produces one of the three valid labels', () => {
    const validLabels = new Set(['High Risk', 'Medium Risk', 'Low Risk']);

    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1 }),
        (score) => {
          const label = computeRiskLabel(score);
          return validLabels.has(label);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
