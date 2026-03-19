const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const Audit = require('../models/Audit');
const Finding = require('../models/Finding');
const auditQueue = require('../queue/auditQueue');

const router = express.Router();

router.use(authMiddleware);

// POST / — create audit and queue job
router.post('/', async (req, res) => {
  try {
    const { targetName, targetUrl, authHeaders, categories, requestTemplate, responsePath, model } = req.body;

    if (!targetName || !targetUrl) {
      return res.status(400).json({ message: 'targetName and targetUrl are required' });
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: 'categories array must contain at least one item' });
    }

    const audit = new Audit({
      userId: req.user._id,
      targetName,
      targetUrl,
      authHeaders: authHeaders || {},
      requestTemplate: requestTemplate || null,
      responsePath: responsePath || '',
      model: model || '',
      status: 'queued'
    });

    await audit.save();

    await auditQueue.add({
      auditId: audit._id.toString(),
      targetUrl,
      authHeaders: authHeaders || {},
      categories,
      requestTemplate: requestTemplate || null,
      responsePath: responsePath || '',
      model: model || ''
    });

    res.status(201).json(audit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /test-connection — proxy to engine (protected by auth middleware)
router.post('/test-connection', async (req, res) => {
  try {
    const engineResponse = await axios.post(
      'http://engine:8000/test-connection',
      req.body
    );
    res.status(engineResponse.status).json(engineResponse.data);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET / — all audits for the current user
router.get('/', async (req, res) => {
  try {
    const audits = await Audit.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /:id/report — download PDF report (on-demand generation fallback)
router.get('/:id/report', async (req, res) => {
  const REPORTS_DIR = '/app/reports';

  try {
    const audit = await Audit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    if (audit.status !== 'complete') {
      return res.status(400).json({ message: 'Audit is not complete yet' });
    }

    const auditId = audit._id.toString();
    const filePath = path.join(REPORTS_DIR, `${auditId}.pdf`);

    // Attempt to serve existing PDF
    let fileExists = false;
    try {
      await fs.promises.access(filePath);
      fileExists = true;
    } catch { /* file does not exist */ }

    // On-demand generation if PDF is missing
    if (!fileExists) {
      console.log(`PDF not found for audit ${auditId}, generating on-demand...`);

      const findings = await Finding.find({ auditId: audit._id });

      const reportBody = {
        auditId,
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
        responseType: 'arraybuffer',
        timeout: 30000
      });

      await fs.promises.mkdir(REPORTS_DIR, { recursive: true });
      await fs.promises.writeFile(filePath, pdfResponse.data);

      audit.reportUrl = `/reports/${auditId}.pdf`;
      await audit.save();
      console.log(`PDF report generated on-demand for audit ${auditId}`);
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=redforge-audit-${auditId}.pdf`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Report download/generation failed:', error.message);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

// GET /:id — single audit with findings
router.get('/:id', async (req, res) => {
  try {
    const audit = await Audit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    const findings = await Finding.find({ auditId: audit._id });

    const response = audit.toObject();
    response.findings = findings;

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
