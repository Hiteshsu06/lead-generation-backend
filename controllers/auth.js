const User = require('../models/User');
const Role = require('../models/Role');
const { generateToken } = require('../utils/jwt');
const { sequelize } = require('../db/connect');
const emailService = require('../services/email');

// Mock user for when database is unavailable
const mockUsers = [
  {
    id: '60d0fe4f5311236168a109ca',
    name: 'Demo User',
    email: 'demo@example.com',
    password: '$2b$10$XAuhtFZwXJCFPVdvUYKx.ectK6hG0IXrGmgb9x.BHbMjxD1TTY.te', // 'password123'
    role: { name: 'user' },
    isEmailVerified: true
  }
];

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
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with token
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if database is connected
    const dbConnected = await isDatabaseConnected();
    if (!dbConnected) {
      // For demo purposes, simulate registration
      return res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        note: 'This is a mock response. Database is not connected.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Get the default 'user' role
    const userRole = await Role.findOne({ where: { name: 'user' } });
    if (!userRole) {
      return res.status(500).json({ error: 'Role not found. Please contact administrator.' });
    }

    // Create user with transaction to ensure data consistency
    const result = await sequelize.transaction(async (t) => {
      try {
        // Create user
        const user = await User.create({
          name,
          email,
          password,
          roleId: userRole.id
        }, { transaction: t });

        // Generate email verification token
        // Wrap in try-catch to handle potential database schema issues
        try {
          const verificationToken = user.generateEmailVerificationToken();
          await user.save({ transaction: t });

          // Send verification email
          try {
            await emailService.sendVerificationEmail(user, verificationToken);
            console.log('Verification email sent to:', email);
          } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // We continue even if email fails, as the user is created
          }
        } catch (verificationError) {
          console.error('Failed to generate verification token:', verificationError);
          // If the columns don't exist yet, we can still create the user
          // The migration will add the columns later
        }

        return user;
      } catch (error) {
        // If there's an error with the email verification fields
        if (error.message && error.message.includes("isEmailVerified")) {
          console.error('Database schema issue - missing isEmailVerified column:', error.message);
          console.log('Please run the migrations to add the missing columns');
          
          // Create user without email verification fields
          const userWithoutVerification = await User.build({
            name,
            email,
            password,
            roleId: userRole.id
          });
          
          // Save only the basic fields
          await userWithoutVerification.save({ 
            transaction: t,
            fields: ['name', 'email', 'password', 'roleId', 'createdAt', 'updatedAt']
          });
          
          return userWithoutVerification;
        }
        
        // Rethrow other errors
        throw error;
      }
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', ')
      });
    }

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // For demo purposes when database is not connected
    const dbConnected = await isDatabaseConnected();
    if (!dbConnected) {
      // For demo purposes, allow login with demo@example.com / password123
      if (email === 'demo@example.com' && password === 'password123') {
        const mockUser = mockUsers[0];
        return res.status(200).json({
          success: true,
          token: generateToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role.name }),
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role.name
          },
          note: 'This is a mock response. Database is not connected.'
        });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find user with role
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Role, as: 'role' }]
    });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified - with handling for missing column
    try {
      if (user.isEmailVerified === false) {
        return res.status(401).json({ 
          error: 'Email not verified',
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before logging in.'
        });
      }
    } catch (error) {
      // If we can't access the isEmailVerified property, it might not exist yet
      // In this case, we'll allow login without verification temporarily
      console.warn('isEmailVerified column might be missing - allowing login without verification');
    }

    // Generate JWT token
    const token = generateToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role.name 
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Verify email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    
    // For demo purposes when database is not connected
    const dbConnected = await isDatabaseConnected();
    if (!dbConnected) {
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now log in to your account.',
        note: 'This is a mock response. Database is not connected.'
      });
    }
    
    // Find user with this verification token
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { [sequelize.Sequelize.Op.gt]: Date.now() }
      }
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Update user - verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    
    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Continue even if welcome email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in to your account.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Resend verification email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message
 */
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // For demo purposes when database is not connected
    const dbConnected = await isDatabaseConnected();
    if (!dbConnected) {
      return res.status(200).json({
        success: true,
        message: 'Verification email sent! Please check your inbox.',
        note: 'This is a mock response. Database is not connected.'
      });
    }
    
    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If your email exists in our system, a verification email has been sent.'
      });
    }
    
    // If already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ 
        error: 'Email is already verified',
        code: 'ALREADY_VERIFIED'
      });
    }
    
    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // Send verification email
    try {
      await emailService.sendVerificationEmail(user, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get current user details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with user details
 */
const getMe = async (req, res) => {
  try {
    // For demo purposes when database is not connected
    const dbConnected = await isDatabaseConnected();
    if (!dbConnected) {
      return res.status(200).json({
        success: true,
        user: {
          id: req.user?.id || 'mock-id',
          name: req.user?.name || 'Demo User',
          email: req.user?.email || 'demo@example.com',
          role: req.user?.role || 'user',
          isEmailVerified: true,
          phoneNumber: null,
          photo: null,
          linkedinId: null,
          address: null
        },
        note: 'This is a mock response. Database is not connected.'
      });
    }

    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'role' }]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        isEmailVerified: user.isEmailVerified,
        phoneNumber: user.phoneNumber,
        photo: user.photo,
        linkedinId: user.linkedinId,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated user
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, linkedinId, address } = req.body;
    const userId = req.user.id;

    // For demo purposes when database is not connected
    const dbConnected = await isDatabaseConnected();
    if (!dbConnected) {
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: userId,
          name: name || 'Demo User',
          email: 'demo@example.com',
          role: 'user',
          phoneNumber: phoneNumber || null,
          linkedinId: linkedinId || null,
          address: address || null
        },
        note: 'This is a mock response. Database is not connected.'
      });
    }

    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user fields
    if (name) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (linkedinId !== undefined) user.linkedinId = linkedinId;
    if (address !== undefined) user.address = address;

    // Save changes
    await user.save();

    // Get updated user with role
    const updatedUser = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }]
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role.name,
        phoneNumber: updatedUser.phoneNumber,
        linkedinId: updatedUser.linkedinId,
        address: updatedUser.address
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
  getMe,
  updateProfile
}; 