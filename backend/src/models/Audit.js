const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetName: {
    type: String,
    required: true
  },
  targetUrl: {
    type: String,
    required: true
  },
  categories: {
    type: [String],
    default: []
  },
  authHeaders: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    select: false
  },
  requestTemplate: {
    type: String,
    default: null
  },
  responsePath: {
    type: String,
    default: ''
  },
  model: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['queued', 'running', 'complete', 'failed'],
    default: 'queued'
  },
  riskScore: {
    type: Number,
    default: 0
  },
  findingsCount: {
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 }
  },
  reportUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

auditSchema.methods.incrementFinding = function(severity) {
  if (this.findingsCount[severity] !== undefined) {
    this.findingsCount[severity] = (this.findingsCount[severity] || 0) + 1;
  }
};

module.exports = mongoose.model('Audit', auditSchema);
