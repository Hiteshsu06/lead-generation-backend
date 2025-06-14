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

/**
 * @route   POST /scraper/leads
 * @desc    Scrape leads from extracted prompt details
 * @access  Public
 */
router.post('/leads', getScrappedLeadsByPrompt);

module.exports = router;