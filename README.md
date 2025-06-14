# Lead Generation Backend

A Node.js Express backend for lead generation and web scraping purposes.

## Setup

```bash
# Install dependencies
npm install

# Start the server in development mode
npm run dev

# Start the server in production mode
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Check if the API is running

### API Routes
- `GET /api` - Test API endpoint

### Scraper Routes
- `GET /scraper/status` - Get scraper status
- `POST /scraper/url` - Scrape a specific URL
  - Request body: `{ "url": "https://example.com" }`

### Scraper API (Enhanced)
- `GET /scraper-api/status` - Get scraper status
- `POST /scraper-api/basic` - Scrape basic info from a URL
  - Request body: `{ "url": "https://example.com" }`
- `POST /scraper-api/comprehensive` - Scrape comprehensive data from a URL
  - Request body: `{ "url": "https://example.com", "options": { "skipLinks": false, "skipImages": false, "mainContentSelector": "body" } }`
  - Returns: Detailed website data including metadata, links, headings, images, and text content
- `POST /scraper-api/search` - Search Google and scrape results based on industry, position, and place
  - Request body: `{ "industry": "technology", "position": "CEO", "place": "San Francisco", "options": { "maxResults": 5, "skipDetailedScraping": false } }`
  - Returns: Google search results with detailed information from each result

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login a user
- `GET /auth/me` - Get current user (protected)

## Technologies Used
- Express.js - Web server framework
- Axios - HTTP client
- Cheerio - Web scraping library
- Node-cron - Task scheduling
- PostgreSQL - Database
- Sequelize - ORM
- JWT - Authentication 