const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.use(authMiddleware);

router.get('/plan', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ plan: user.plan, auditCount: user.auditCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.all('*', (req, res) => {
  res.json({ message: 'coming soon' });
});

module.exports = router;
