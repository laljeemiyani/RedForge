const express = require('express');
const authMiddleware = require('../middleware/auth');
const Audit = require('../models/Audit');
const Finding = require('../models/Finding');
const auditQueue = require('../queue/auditQueue');

const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { targetName, targetUrl, authHeaders } = req.body;

    if (!targetName || !targetUrl) {
      return res.status(400).json({ message: 'targetName and targetUrl are required' });
    }

    const audit = new Audit({
      userId: req.user._id,
      targetName,
      targetUrl,
      authHeaders: authHeaders || {}
    });

    await audit.save();

    await auditQueue.add({ auditId: audit._id });

    res.status(201).json(audit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const audits = await Audit.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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
