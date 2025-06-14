const express = require('express');
const router = express.Router();

/**
 * @route   GET /api
 * @desc    Test API route
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

module.exports = router; 