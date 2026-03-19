const Queue = require('bull');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Audit = require('../models/Audit');
const Finding = require('../models/Finding');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const auditQueue = new Queue('audit-jobs', redisUrl);

const REPORTS_DIR = '/app/reports';

auditQueue.process(async (job) => {
  const { auditId, targetUrl, authHeaders, categories } = job.data;
  console.log(`Processing audit job for auditId: ${auditId}`);

  try {
    await Audit.findByIdAndUpdate(auditId, { status: 'running' });

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

    const findings = [];
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
      findings.push(finding);
      audit.incrementFinding(result.severity);
    }

    await audit.save();
    console.log(`Audit job ${auditId} completed successfully.`);

    // Generate and save PDF report
    try {
      await fs.promises.mkdir(REPORTS_DIR, { recursive: true });

      const reportBody = {
        auditId: audit._id.toString(),
        targetName: audit.targetName,
        targetUrl: audit.targetUrl,
        status: audit.status,
        riskScore: audit.riskScore,
        findingsCount: audit.findingsCount,
        completedAt: audit.completedAt,
        findings: findings.map(f => ({
          category: f.category,
          severity: f.severity,
          title: f.title,
          description: f.description,
          transcript: f.transcript,
          remediation: f.remediation
        }))
      };

      const pdfResponse = await axios.post('http://engine:8000/generate-report', reportBody, {
        responseType: 'arraybuffer'
      });

      const pdfPath = path.join(REPORTS_DIR, `${auditId}.pdf`);
      await fs.promises.writeFile(pdfPath, pdfResponse.data);

      audit.reportUrl = `/reports/${auditId}.pdf`;
      await audit.save();
      console.log(`PDF report saved for audit ${auditId}`);
    } catch (pdfError) {
      console.error(`PDF generation failed for auditId: ${auditId}`, pdfError.message);
    }

  } catch (error) {
    console.error(`Audit job failed for auditId: ${auditId}`, error.message);
    await Audit.findByIdAndUpdate(auditId, { status: 'failed' });
  }
});

module.exports = auditQueue;
