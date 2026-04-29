const { computeRiskLabel } = require('./riskLabel');

describe('computeRiskLabel', () => {
  // High Risk: score >= 0.7
  test('returns "High Risk" for score of 0.7 (lower boundary)', () => {
    expect(computeRiskLabel(0.7)).toBe('High Risk');
  });

  test('returns "High Risk" for score of 1.0 (maximum)', () => {
    expect(computeRiskLabel(1.0)).toBe('High Risk');
  });

  test('returns "High Risk" for score of 0.85', () => {
    expect(computeRiskLabel(0.85)).toBe('High Risk');
  });

  // Medium Risk: 0.4 <= score < 0.7
  test('returns "Medium Risk" for score of 0.4 (lower boundary)', () => {
    expect(computeRiskLabel(0.4)).toBe('Medium Risk');
  });

  test('returns "Medium Risk" for score just below 0.7 (0.699)', () => {
    expect(computeRiskLabel(0.699)).toBe('Medium Risk');
  });

  test('returns "Medium Risk" for score of 0.55', () => {
    expect(computeRiskLabel(0.55)).toBe('Medium Risk');
  });

  // Low Risk: score < 0.4
  test('returns "Low Risk" for score of 0.0 (minimum)', () => {
    expect(computeRiskLabel(0.0)).toBe('Low Risk');
  });

  test('returns "Low Risk" for score just below 0.4 (0.399)', () => {
    expect(computeRiskLabel(0.399)).toBe('Low Risk');
  });

  test('returns "Low Risk" for score of 0.2', () => {
    expect(computeRiskLabel(0.2)).toBe('Low Risk');
  });

  // Verify no score produces undefined
  test('never returns undefined for any score in [0, 1]', () => {
    [0.0, 0.1, 0.39, 0.4, 0.5, 0.69, 0.7, 0.9, 1.0].forEach((score) => {
      expect(computeRiskLabel(score)).toBeDefined();
    });
  });

  // Verify only valid labels are returned
  test('only returns one of the three valid labels', () => {
    const validLabels = ['High Risk', 'Medium Risk', 'Low Risk'];
    [0.0, 0.399, 0.4, 0.699, 0.7, 1.0].forEach((score) => {
      expect(validLabels).toContain(computeRiskLabel(score));
    });
  });
});
