const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(
  config.DB.DATABASE,
  config.DB.USER,
  config.DB.PASSWORD,
  {
    host: config.DB.HOST,
    dialect: config.DB.DIALECT,
    operatorsAliases: 0,
    pool: {
      max: config.DB.POOL.max,
      min: config.DB.POOL.min,
      acquire: config.DB.POOL.acquire,
      idle: config.DB.POOL.idle
    },
    logging: false
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected Successfully!');
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error.message);
    console.log('The application will continue without database functionality.');
    console.log('To use database features, please ensure PostgreSQL is installed and running.');
    return false;
  }
};

// Initialize the database by syncing all models
const initDB = async () => {
  try {
    // This will sync all models and create tables if they don't exist
    // Force: true will drop the table if it already exists (use carefully!)
    await sequelize.sync({ force: false });
    console.log('Database tables synced successfully!');

    // Initialize roles after models are synced
    try {
      // We need to do this dynamically to avoid circular dependencies
      const Role = require('../models/Role');
      await Role.initializeRoles();
    } catch (error) {
      console.error('Error initializing roles:', error.message);
    }

    return true;
  } catch (error) {
    console.error('Error syncing database:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  connectDB,
  initDB
}; 