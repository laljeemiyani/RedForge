const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const Audit = require('../models/Audit');
const Finding = require('../models/Finding');
const auditQueue = require('../queue/auditQueue');

const router = express.Router();

router.use(authMiddleware);

// POST / — create audit and queue job
router.post('/', async (req, res) => {
  try {
    const { targetName, targetUrl, authHeaders, categories } = req.body;

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
      status: 'queued'
    });

    await audit.save();

    await auditQueue.add({
      auditId: audit._id.toString(),
      targetUrl,
      authHeaders: authHeaders || {},
      categories
    });

    res.status(201).json(audit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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

// GET /:id/report — download PDF report
router.get('/:id/report', async (req, res) => {
  try {
    const audit = await Audit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    if (!audit.reportUrl) {
      return res.status(404).json({ message: 'Report not ready yet' });
    }

    const auditId = audit._id.toString();
    const filePath = path.join('/app/reports', `${auditId}.pdf`);

    const fileBuffer = await fs.promises.readFile(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=redforge-audit-${auditId}.pdf`);
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
