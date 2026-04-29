const { parse } = require('csv-parse/sync');
const axios = require('axios');
const JobCheck = require('../models/JobCheck');
const { computeRiskLabel } = require('../utils/riskLabel');

/**
 * POST /api/predict/batch
 * Parses a CSV file, runs AI prediction on each valid row, persists JobChecks.
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
async function handleBatchPredict(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  let rows;
  try {
    rows = parse(req.file.buffer, { columns: true, skip_empty_lines: false });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid CSV file' });
  }

  if (rows.length > 500) {
    return res.status(422).json({ error: 'Too many rows (max 500)' });
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  const results = [];
  const warnings = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i;

    // Find description column (case-insensitive), fall back to first column value
    const descKey = Object.keys(row).find(k => k.toLowerCase() === 'description');
    const description = descKey ? row[descKey] : Object.values(row)[0];

    if (!description || description.trim() === '') {
      warnings.push({ row: rowIndex, reason: 'Empty description' });
      continue;
    }

    let aiResponse;
    try {
      aiResponse = await axios.post(
        `${aiServiceUrl}/predict`,
        { text: description },
        { timeout: 5000 }
      );
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        return res.status(504).json({ error: 'AI service did not respond in time' });
      }
      return res.status(503).json({ error: 'AI service unavailable' });
    }

    const { scam_probability, suspicious_phrases } = aiResponse.data;
    const riskLabel = computeRiskLabel(scam_probability);

    const jobCheck = await JobCheck.create({
      userId: req.userId,
      inputText: description,
      scamProbability: scam_probability,
      suspiciousPhrases: suspicious_phrases || [],
      riskLabel,
      source: 'csv',
      createdAt: new Date()
    });

    results.push({
      rowIndex,
      scam_probability,
      suspicious_phrases,
      riskLabel,
      checkId: jobCheck._id
    });
  }

  return res.status(200).json({ results, warnings });
}

module.exports = { handleBatchPredict };
