const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, resendVerificationEmail, getMe, updateProfile } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /auth/verify
 * @desc    Verify email with token (using query parameter)
 * @access  Public
 */
router.get('/verify', verifyEmail);

/**
 * @route   POST /auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', resendVerificationEmail);

/**
 * @route   GET /auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, updateProfile);

module.exports = router; 