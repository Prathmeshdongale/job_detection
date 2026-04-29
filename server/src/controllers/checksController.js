const JobCheck = require('../models/JobCheck');

/**
 * GET /api/checks — retrieve paginated, filtered check history for authenticated user
 * Query params: page, limit, risk (Low Risk|Medium Risk|High Risk), search, dateFrom, dateTo
 */
async function getChecks(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId: req.userId };

    // Risk filter
    if (req.query.risk && ['Low Risk', 'Medium Risk', 'High Risk'].includes(req.query.risk)) {
      filter.riskLabel = req.query.risk;
    }

    // Keyword search on inputText
    if (req.query.search && req.query.search.trim()) {
      filter.inputText = { $regex: req.query.search.trim(), $options: 'i' };
    }

    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) {
        const to = new Date(req.query.dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    const [checks, total] = await Promise.all([
      JobCheck.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      JobCheck.countDocuments(filter),
    ]);

    return res.status(200).json({ checks, pagination: { page, limit, total } });
  } catch (err) {
    console.error('Error fetching checks:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/checks/export — download all checks as CSV
 */
async function exportChecks(req, res) {
  try {
    const checks = await JobCheck.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Date', 'Risk', 'Score (%)', 'Source', 'Flagged Phrases', 'Job Preview'];
    const rows = checks.map((c) => [
      escape(new Date(c.createdAt).toISOString()),
      escape(c.riskLabel),
      escape(Math.round(c.scamProbability * 100)),
      escape(c.source),
      escape((c.suspiciousPhrases || []).join('; ')),
      escape(c.inputText?.slice(0, 200)),
    ]);

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="jobguard-history.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    console.error('Error exporting checks:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/checks/analytics — aggregated stats for trends page
 */
async function getAnalytics(req, res) {
  try {
    const userId = req.userId;
    const mongoose = require('mongoose');
    const uid = new mongoose.Types.ObjectId(userId);

    const [riskDist, dailyTrend, topPhrases, totalCount] = await Promise.all([
      // Risk distribution
      JobCheck.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: '$riskLabel', count: { $sum: 1 } } },
      ]),
      // Daily trend last 30 days
      JobCheck.aggregate([
        { $match: { userId: uid, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, avgScore: { $avg: '$scamProbability' } } },
        { $sort: { _id: 1 } },
      ]),
      // Top suspicious phrases
      JobCheck.aggregate([
        { $match: { userId: uid } },
        { $unwind: '$suspiciousPhrases' },
        { $group: { _id: '$suspiciousPhrases', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      JobCheck.countDocuments({ userId: uid }),
    ]);

    return res.status(200).json({ riskDist, dailyTrend, topPhrases, totalCount });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/checks/:id — delete a check owned by the authenticated user
 * 
 * Route params:
 *   - id: JobCheck document _id
 * 
 * Returns:
 *   204 (no body) on success
 *   404 { error: "Check not found" } if check doesn't exist
 *   403 { error: "Forbidden" } if check belongs to another user
 * 
 * Requirements: 7.5, 7.6
 */
async function deleteCheck(req, res) {
  try {
    const checkId = req.params.id;

    // Find the check by ID
    const jobCheck = await JobCheck.findById(checkId);

    if (!jobCheck) {
      return res.status(404).json({ error: 'Check not found' });
    }

    // Verify ownership
    if (jobCheck.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete the document
    await JobCheck.findByIdAndDelete(checkId);

    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting check:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getChecks,
  exportChecks,
  getAnalytics,
  deleteCheck
};
