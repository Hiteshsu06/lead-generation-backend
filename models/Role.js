const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connect');

const Role = sequelize.define('role', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Role name is required' }
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

// Create initial roles if they don't exist
Role.initializeRoles = async () => {
  try {
    const roles = [
      { name: 'user', description: 'Regular user with basic permissions' },
      { name: 'admin', description: 'Administrator with management permissions' },
      { name: 'super_admin', description: 'Super administrator with full system access' }
    ];

    for (const role of roles) {
      await Role.findOrCreate({
        where: { name: role.name },
        defaults: role
      });
    }

    console.log('✅ Roles initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing roles:', error.message);
  }
};

module.exports = Role; 