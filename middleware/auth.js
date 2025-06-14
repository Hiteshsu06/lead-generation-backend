const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');
const { sequelize } = require('../db/connect');

// Helper function to check if database is connected
const isDatabaseConnected = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Protect routes - verify JWT token and set req.user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ error: 'Not authorized to access this route' });
    }

    // Verify token
    const decoded = verifyToken(token);

    // If database is not connected, use decoded info directly
    const dbConnected = await isDatabaseConnected();
    if (!dbConnected) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'user'
      };
      return next();
    }

    // Find user by id
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

/**
 * Authorize by role
 * @param  {...String} roles - Roles to authorize
 * @returns {Function} - Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
}; 