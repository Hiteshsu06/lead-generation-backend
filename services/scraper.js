const { chromium } = require('playwright');
const axios = require('axios');
const natural = require('natural');
const { positions, industries } = require('../utils/helpers');


async function isValidPlace(token) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(token)}&format=json`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'YourAppName/1.0 (your@email.com)'
      }
    });

    const data = response.data;

    // Check if any result has a valid name and addresstype like 'city', 'county', 'state', etc.
    return data.some(
      place =>
        place.name &&
        ['city', 'town', 'village', 'county', 'state_district', 'state'].includes(place.addresstype)
    );
  } catch (err) {
    console.error(`Failed to validate place "${token}":`, err.message);
    return false;
  }
}

async function extractInfo(sentence) {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(sentence.toLowerCase());

  let result = {};

  // Extract position and industry
  for (let token of tokens) {
    if (positions.includes(token)) {
      result.position = token.toUpperCase();
    } else if (industries.includes(token)) {
      result.industry = `${token} industry`;
    }
  }
  const fromWords = ['from'];

  // Look for the word "from" and use the next token as candidate for place
  const fromIndex = tokens.findIndex(token => fromWords.includes(token.toLowerCase()));
  if (fromIndex !== -1 && tokens.length > fromIndex + 1) {
    const placeCandidate = tokens[fromIndex + 1];
    const valid = await isValidPlace(placeCandidate);

    if (valid) {
      result.place = placeCandidate.charAt(0).toUpperCase() + placeCandidate.slice(1);
    }
  }

  return result;
}

/**
 * Creates a browser context with stealth-like settings
 */
async function createStealthContext() {
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
    javaScriptEnabled: true,
  });

  const page = await context.newPage();

  // Minor fingerprint tweaks (navigator.webdriver, etc.)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  return { browser, page };
}

/**
 * Creates a browser supported search text query
 */
function buildBooleanSearchQuery({ position, place, industry }) {
  if (!position || !place || !industry) {
    throw new Error('position, place, and industry are required.');
  }

  const format = (str) => str.trim().toLowerCase();

  const query = `(${format(position)} and ${format(place)} and ${format(industry)}) and linkedin profile`;

  return query;
}

/**
 * Scrapes details from a given URL using Playwright
 * @param {string} url - The URL to scrape
 * @returns {Object} - The scraped details
 */
async function getPromptScrappedDetails(searchQuery) {
  try {
    const searchParameters = await extractInfo(searchQuery);
    return searchParameters;
  } catch (error) {
    // await browser.close();
    throw new Error(`Failed to scrape search results: ${error.message}`);
  }
}

/**
 * Scrapes leads based on industry, position, and location using Playwright
 * @param {string} url - The base URL (optional)
 * @param {Object} options - Options containing industry, position, and place
 * @returns {Object} - The scraped leads details
 */
async function getScrappedLeadsDetails(url, options) {
  const { industry, position, place } = options;

  if (!industry || !position || !place) {
    throw new Error(
      'Missing required parameters: industry, position, or place'
    );
  }

  const query = `${position} ${industry} ${place}`;
  const encodedQuery = encodeURIComponent(query);
  const searchUrl = url || `https://www.google.com/search?q=${encodedQuery}`;

  const { browser, page } = await createStealthContext();

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

    const results = await page.evaluate(() => {
      const items = [];
      const resultBlocks = document.querySelectorAll('div.g');

      resultBlocks.forEach((block) => {
        const titleEl = block.querySelector('h3');
        const linkEl = block.querySelector('a');
        const snippetEl = block.querySelector('.VwiC3b');

        if (titleEl && linkEl) {
          items.push({
            title: titleEl.innerText,
            link: linkEl.href,
            snippet: snippetEl ? snippetEl.innerText : '',
          });
        }
      });

      return items;
    });

    await browser.close();

    return {
      query,
      url: searchUrl,
      results,
      count: results.length,
      timestamp: new Date(),
    };
  } catch (error) {
    await browser.close();
    console.error('Error scraping leads:', error.message);
    throw new Error(`Failed to scrape leads: ${error.message}`);
  }
}

module.exports = {
  getPromptScrappedDetails,
  getScrappedLeadsDetails,
};
