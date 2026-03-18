const Queue = require('bull');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const auditQueue = new Queue('audit-jobs', redisUrl);

auditQueue.process(async (job) => {
  console.log("Processing audit job: " + job.id);
  // Placeholder logic for processing the audit job
});

module.exports = auditQueue;
