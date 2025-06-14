const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../db/connect');
const Role = require('./Role');

const User = sequelize.define('user', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a name' },
      len: { args: [2, 50], msg: 'Name must be between 2 and 50 characters' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      args: true,
      msg: 'Email already in use'
    },
    validate: {
      isEmail: { msg: 'Please provide a valid email' },
      notEmpty: { msg: 'Please provide an email' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a password' },
      len: { args: [6], msg: 'Password must be at least 6 characters' }
    }
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkedinId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    // Hash password before creating or updating a user
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Define relationships
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// Instance method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if a user exists by email
User.findByEmail = async function(email) {
  return await this.findOne({ 
    where: { email },
    include: [{ model: Role, as: 'role' }]
  });
};

// Generate email verification token
User.prototype.generateEmailVerificationToken = function() {
  // Generate a random token
  const token = require('crypto').randomBytes(32).toString('hex');
  
  // Set the token and expiration (24 hours)
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  return token;
};

module.exports = User; 