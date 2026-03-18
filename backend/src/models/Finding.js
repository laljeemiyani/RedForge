const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
  auditId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audit',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  transcript: {
    type: [mongoose.Schema.Types.Mixed]
  },
  remediation: {
    type: String
  }
});

module.exports = mongoose.model('Finding', findingSchema);
