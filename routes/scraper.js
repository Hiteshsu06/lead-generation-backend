const express = require('express');
const router = express.Router();
const {
  getPromptDetails,
  getScrappedLeadsByPrompt
} = require('../controllers/scraper');

/**
 * @route   GET /scraper/details
 * @desc    Get scraper details
 * @access  Public
 */
router.get('/details', getPromptDetails);

module.exports = router;