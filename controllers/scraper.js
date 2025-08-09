const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chromium } = require('playwright');

const GEMINI_API_KEY = "AIzaSyB4EMHgk-rc2jDZEn6GORyYfn_QR5apaXM";
const ai = new GoogleGenerativeAI(GEMINI_API_KEY);

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

  try {
    const prompt = `You are an AI assistant. Extract the following fields from the given sentence:
    - "industry" (example: IT, finance, healthcare)
    - "position" (example: CEO, software engineer)
    - "experience" (example: 10+ years, 5 years)

    Return only a valid JSON object with the keys: industry, position, experience.
    Do not include any explanation or text outside the JSON object.
    Ensure the output is enclosed within a JSON markdown code block (e.g., \`\`\`json{...}\`\`\`).

    Sentence: "${search}"`;

    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text(); // Get the raw text from the AI

    // --- NEW: Extract JSON from markdown code block ---
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    let jsonString;

    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1]; // The captured group is the JSON content
    } else {
      // If no markdown block is found, assume the text itself is the JSON string
      // or handle this as an error if markdown is strictly expected.
      jsonString = text;
      console.warn("AI response did not contain a 'json' markdown block. Attempting to parse raw text.");
    }
    // --- END NEW ---

    // Parse the JSON output from the model
    let extractedDetails;
    try {
      extractedDetails = JSON.parse(jsonString); // Parse the cleaned JSON string
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini response:', jsonString, parseError.message);
      return res.status(500).json({ error: 'Failed to parse AI response as JSON.', detail: parseError.message });
    }

    return res.status(200).json(extractedDetails);

  } catch (err) {
    console.error('Gemini API error:', err.message);
    return res.status(500).json({ error: 'Failed to generate content from Gemini.', detail: err.message });
  }
};

/**
 * Scrape Google Search results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const scrapeGoogleSearch = async (req, res) => {
  const { search } = req.query;

  if (!search) {
    return res.status(400).json({ error: 'Missing `search` query parameter.' });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const searchURL = `https://www.google.com/search?q=${encodeURIComponent(search)}`;
    await page.goto(searchURL, { waitUntil: 'domcontentloaded' });

    const results = await page.$$eval('div.g', (nodes) =>
      nodes.map((node) => {
        const title = node.querySelector('h3')?.innerText;
        const link = node.querySelector('a')?.href;
        return { title, link };
      })
    );

    const filteredResults = results.filter(r => r.title && r.link);

    await browser.close();
    return res.status(200).json({ results: filteredResults });

  } catch (err) {
    await browser.close();
    console.error('Google scraping error:', err.message);
    return res.status(500).json({ error: 'Failed to scrape Google.', detail: err.message });
  }
};

module.exports = {
  getPromptDetails,
  scrapeGoogleSearch
};