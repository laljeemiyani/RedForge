const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const Audit = require('../models/Audit');
const Finding = require('../models/Finding');
const auditQueue = require('../queue/auditQueue');

const router = express.Router();

function isUrlSafe(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const hostname = parsed.hostname.toLowerCase();

    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^0\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ];

    const blockedHosts = [
      '169.254.169.254',
      'metadata.google.internal',
      'metadata.azure.com',
    ];

    if (blockedHosts.includes(hostname)) return false;
    if (privatePatterns.some((pattern) => pattern.test(hostname))) return false;

    return true;
  } catch {
    return false;
  }
}

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

    if (!isUrlSafe(targetUrl)) {
      return res.status(400).json({ message: 'Invalid or unsafe target URL' });
    }

    const audit = new Audit({
      userId: req.user._id || req.user.id,
      targetName,
      targetUrl,
      categories,
      authHeaders: authHeaders || {},
      requestTemplate: requestTemplate || null,
      responsePath: responsePath || '',
      model: model || '',
      status: 'queued'
    });

    await audit.save();

    await auditQueue.add({
      auditId: audit._id.toString()
    });

    const auditResponse = audit.toObject();
    delete auditResponse.authHeaders;

    return res.status(201).json(auditResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /test-connection — proxy to engine (protected by auth middleware)
router.post('/test-connection', async (req, res) => {
  try {
    if (!isUrlSafe(req.body.targetUrl)) {
      return res.status(400).json({ message: 'Invalid or unsafe target URL' });
    }

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
    const audits = await Audit.find({ userId: req.user._id || req.user.id })
      .select('-authHeaders')
      .sort({ createdAt: -1 });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /:id/report — download PDF report (on-demand generation fallback)
router.get('/:id/report', async (req, res) => {
  const REPORTS_DIR = '/app/reports';

  try {
    const audit = await Audit.findOne({ _id: req.params.id, userId: req.user._id || req.user.id })
      .select('_id reportUrl status');
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

      const fullAudit = await Audit.findOne({ _id: req.params.id, userId: req.user._id || req.user.id })
        .select('-authHeaders');
      if (!fullAudit) {
        return res.status(404).json({ message: 'Audit not found' });
      }

      const findings = await Finding.find({ auditId: audit._id });

      const reportBody = {
        auditId,
        targetName: fullAudit.targetName,
        targetUrl: fullAudit.targetUrl,
        status: fullAudit.status,
        riskScore: fullAudit.riskScore,
        findingsCount: fullAudit.findingsCount,
        completedAt: fullAudit.completedAt,
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

      await Audit.findByIdAndUpdate(auditId, { reportUrl: `/reports/${auditId}.pdf` });
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
    const audit = await Audit.findOne({ _id: req.params.id, userId: req.user._id || req.user.id })
      .select('-authHeaders');
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
