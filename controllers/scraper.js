const {
    getPromptScrappedDetails, 
    getScrappedLeadsDetails  
} = require('../services/scraper');

/**
 * Get scraper status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPromptDetails = async (req, res) => {
  const { search } = req.query;
  
  if (!search) {
    return res.status(400).json({ error: 'Missing `search` query parameter.' });
  }

  const scrapedData = await getPromptScrappedDetails(search);
  res.json(scrapedData);
};

/**
 * Scrape comprehensive data from a URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getScrappedLeadsByPrompt = async (req, res) => {
  const { url } = req.body;
  const { industry, position, place } = req.body;
  
  // Validate required parameters
  if (!industry || !position || !place) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      message: 'Industry, position, and place are required',
      required: ['industry', 'position', 'place']
    });
  };

  const options = req.body;

  try {
    const scrapedData = await getScrappedLeadsDetails(url, options);
    res.json(scrapedData);
  } catch (error) {
    res.status(500).json({ 
      error: 'Comprehensive scraping failed', 
      message: error.message 
    });
  }
};

module.exports = {
  getPromptDetails,
  getScrappedLeadsByPrompt
};