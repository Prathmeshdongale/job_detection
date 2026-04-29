const axios = require('axios');
const crypto = require('crypto');
const JobCheck = require('../models/JobCheck');
const { computeRiskLabel } = require('../utils/riskLabel');

/**
 * Extract job title from text using simple heuristics.
 * Looks for "Job Title:", "Position:", "Role:" prefixes or first capitalised line.
 */
function extractJobTitle(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Look for explicit label
  for (const line of lines.slice(0, 10)) {
    const m = line.match(/^(?:job\s*title|position|role|vacancy)[:\s]+(.+)/i);
    if (m) return m[1].trim().slice(0, 80);
  }

  // First short line that looks like a title (capitalised, < 60 chars)
  for (const line of lines.slice(0, 5)) {
    if (line.length < 60 && /^[A-Z]/.test(line) && !/[.?!]$/.test(line)) {
      return line.slice(0, 80);
    }
  }
  return null;
}

/**
 * Generate a plain-English explanation of the fraud score.
 */
function generateExplanation(scamProbability, suspiciousPhrases, riskLabel) {
  const pct = Math.round(scamProbability * 100);
  const phraseCount = suspiciousPhrases.length;

  if (riskLabel === 'High Risk') {
    return `This job posting scored ${pct}% on our fraud detector — well above the danger threshold. ${
      phraseCount > 0
        ? `We found ${phraseCount} suspicious phrase${phraseCount > 1 ? 's' : ''} commonly used in scam listings: "${suspiciousPhrases.slice(0, 3).join('", "')}". `
        : ''
    }The language patterns strongly resemble known fake job postings. We recommend avoiding this listing and not sharing any personal or financial information.`;
  }

  if (riskLabel === 'Medium Risk') {
    return `This posting scored ${pct}% — in the suspicious range. ${
      phraseCount > 0
        ? `${phraseCount} phrase${phraseCount > 1 ? 's were' : ' was'} flagged: "${suspiciousPhrases.slice(0, 2).join('", "')}". `
        : ''
    }While not definitively fake, we suggest researching the company independently before applying or sharing personal details.`;
  }

  return `This posting scored ${pct}% — within the legitimate range. ${
    phraseCount > 0
      ? `One minor flag was noted ("${suspiciousPhrases[0]}") but it does not significantly affect the overall assessment. `
      : 'No suspicious phrases were detected. '
  }The job appears genuine, but always verify the company through official channels before applying.`;
}

/**
 * POST /api/predict
 */
async function handlePredict(req, res) {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'text is required' });
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  let aiResponse;
  try {
    aiResponse = await axios.post(`${aiServiceUrl}/predict`, { text }, { timeout: 10000 });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'AI service did not respond in time' });
    }
    return res.status(503).json({ error: 'AI service unavailable' });
  }

  const { scam_probability, suspicious_phrases } = aiResponse.data;
  const riskLabel = computeRiskLabel(scam_probability);
  const jobTitle = extractJobTitle(text);
  const aiExplanation = generateExplanation(scam_probability, suspicious_phrases || [], riskLabel);

  const jobCheck = await JobCheck.create({
    userId: req.userId,
    inputText: text,
    jobTitle,
    scamProbability: scam_probability,
    suspiciousPhrases: suspicious_phrases || [],
    riskLabel,
    aiExplanation,
    source: 'manual',
    createdAt: new Date(),
  });

  return res.status(200).json({
    scam_probability,
    suspicious_phrases,
    checkId: jobCheck._id,
    riskLabel,
    jobTitle,
    aiExplanation,
  });
}

/**
 * POST /api/predict/:id/share — generate a shareable token for a check
 */
async function createShareLink(req, res) {
  try {
    const check = await JobCheck.findById(req.params.id);
    if (!check) return res.status(404).json({ error: 'Check not found' });
    if (check.userId.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    if (!check.shareToken) {
      check.shareToken = crypto.randomBytes(16).toString('hex');
      await check.save();
    }

    return res.status(200).json({ shareToken: check.shareToken });
  } catch (err) {
    console.error('createShareLink error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/predict/shared/:token — public endpoint, no auth required
 */
async function getSharedCheck(req, res) {
  try {
    const check = await JobCheck.findOne({ shareToken: req.params.token })
      .select('-userId -shareToken')
      .lean();
    if (!check) return res.status(404).json({ error: 'Shared result not found or expired' });
    return res.status(200).json(check);
  } catch (err) {
    console.error('getSharedCheck error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { handlePredict, createShareLink, getSharedCheck };
