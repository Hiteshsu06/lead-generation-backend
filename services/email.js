const nodemailer = require('nodemailer');
const config = require('../config');

// Create a transporter
const createTransporter = () => {
  // Use the configured email service directly
  return Promise.resolve(nodemailer.createTransport({
    service: config.EMAIL.SERVICE,
    host: config.EMAIL.HOST,
    port: config.EMAIL.PORT,
    secure: config.EMAIL.SECURE,
    auth: {
      user: config.EMAIL.USER,
      pass: config.EMAIL.PASS
    }
  }));
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} - Email info
 */
const sendEmail = async (options) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: config.EMAIL.FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

/**
 * Send an email verification email
 * @param {Object} user - User object
 * @param {string} token - Verification token
 * @returns {Promise<Object>} - Email info
 */
const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${token}`;
  
  return sendEmail({
    to: user.email,
    subject: 'Indus Lead - Verify Your Email',
    text: `
      Hello ${user.name},
      
      Thank you for registering with Indus Lead. Please verify your email by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you did not sign up for Indus Lead, please ignore this email.
      
      Best regards,
      The Indus Lead Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5;">Indus Lead</h1>
        </div>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Thank you for registering with Indus Lead. Please verify your email by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Your Email</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not sign up for Indus Lead, please ignore this email.</p>
        <p>Best regards,<br>The Indus Lead Team</p>
      </div>
    `
  });
};

/**
 * Send a welcome email after verification
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Email info
 */
const sendWelcomeEmail = async (user) => {
  const loginUrl = `${config.CLIENT_URL}/login`;
  
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Indus Lead!',
    text: `
      Hello ${user.name},
      
      Thank you for verifying your email. Your account is now active!
      
      You can now log in to your account and start using Indus Lead:
      
      ${loginUrl}
      
      Best regards,
      The Indus Lead Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5;">Indus Lead</h1>
        </div>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Thank you for verifying your email. Your account is now active!</p>
        <p>You can now log in to your account and start using Indus Lead:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
        </div>
        <p>Best regards,<br>The Indus Lead Team</p>
      </div>
    `
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail
}; 