require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || '111111',
    DATABASE: process.env.DB_NAME || 'lead_generation',
    DIALECT: 'postgres',
    POOL: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',
  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE || 'gmail',
    HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    PORT: process.env.EMAIL_PORT || 587,
    SECURE: process.env.EMAIL_SECURE === 'true' || false,
    USER: process.env.EMAIL_USER || 'hiteshsukhpal03@gmail.com',
    PASS: process.env.EMAIL_PASS || 'pqyjjvgkzdpijayk',
    FROM: process.env.EMAIL_FROM || 'Indus Lead <hiteshsukhpal03@gmail.com>'
  },
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:8080'
}; 