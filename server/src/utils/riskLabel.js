/**
 * Computes a human-readable risk label from a scam probability score.
 *
 * @param {number} score - A probability value in the range [0.0, 1.0]
 * @returns {"High Risk" | "Medium Risk" | "Low Risk"}
 */
function computeRiskLabel(score) {
  if (score >= 0.7) return 'High Risk';
  if (score >= 0.4) return 'Medium Risk';
  return 'Low Risk';
}

module.exports = { computeRiskLabel };
