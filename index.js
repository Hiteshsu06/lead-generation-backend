const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connectDB, initDB } = require('./db/connect');

// Import routes
const apiRoutes = require('./routes/api');
const scraperRoutes = require('./routes/scraper');
const authRoutes = require('./routes/auth');

// Initialize express app
const app = express();
const PORT = config.PORT;

// Connect to PostgreSQL and initialize database
const setupDatabase = async () => {
  try {
    console.log('Attempting to connect to PostgreSQL...');
    const connected = await connectDB();
    
    if (connected) {
      // Initialize database (sync models)
      await initDB();
    } else {
      console.warn('Failed to connect to PostgreSQL. Some features may not work properly.');
      console.warn('The application will continue in demo mode.');
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
    console.warn('The application will continue in demo mode.');
  }
};

setupDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Lead Generation API' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Use routes
app.use('/api', apiRoutes);
app.use('/scraper', scraperRoutes);
app.use('/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
  console.log('Routes:');
  console.log('  GET  /           - Welcome message');
  console.log('  GET  /health     - Health check');
  console.log('  POST /auth/login - User login');
  console.log('  POST /auth/register - User registration');
  console.log('  GET  /auth/me    - Get current user (protected)');
  console.log('  POST /scraper-api/basic - Scrape basic info from a URL');
  console.log('  POST /scraper-api/comprehensive - Scrape comprehensive data from a URL');
});