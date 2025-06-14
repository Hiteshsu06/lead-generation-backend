const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id and other payload data
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE }
  );
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken
}; 