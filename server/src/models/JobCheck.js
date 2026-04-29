const mongoose = require('mongoose');

const JobCheckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputText: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    default: null
  },
  scamProbability: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  riskLabel: {
    type: String,
    enum: ['Low Risk', 'Medium Risk', 'High Risk'],
    required: true
  },
  suspiciousPhrases: {
    type: [String],
    default: []
  },
  aiExplanation: {
    type: String,
    default: null
  },
  source: {
    type: String,
    enum: ['manual', 'csv'],
    required: true
  },
  shareToken: {
    type: String,
    default: null,
    index: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

JobCheckSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('JobCheck', JobCheckSchema);
