const Queue = require('bull');
const axios = require('axios');
const Audit = require('../models/Audit');
const Finding = require('../models/Finding');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const auditQueue = new Queue('audit-jobs', redisUrl);

auditQueue.process(async (job) => {
  const { auditId, targetUrl, authHeaders, categories } = job.data;
  console.log(`Processing audit job for auditId: ${auditId}`);
  
  try {
    await Audit.findByIdAndUpdate(auditId, { status: "running" });

    const response = await axios.post('http://engine:8000/run-audit', {
      auditId,
      targetUrl,
      authHeaders: authHeaders || {},
      categories
    });

    const data = response.data;
    const audit = await Audit.findById(auditId);
    
    if (!audit) {
        throw new Error(`Audit with id ${auditId} not found`);
    }

    audit.status = 'complete';
    audit.riskScore = data.riskScore;
    audit.completedAt = new Date();

    for (const result of data.results) {
      const finding = new Finding({
        auditId: audit._id,
        category: result.category,
        severity: result.severity,
        title: result.title,
        description: result.description,
        transcript: result.transcript,
        remediation: result.remediation
      });
      await finding.save();
      
      audit.incrementFinding(result.severity);
    }

    await audit.save();
    console.log(`Audit job ${auditId} completed successfully.`);
  } catch (error) {
    console.error(`Audit job failed for auditId: ${auditId}`, error.message);
    await Audit.findByIdAndUpdate(auditId, { status: "failed" });
  }
});

module.exports = auditQueue;
