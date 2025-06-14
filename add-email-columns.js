require('dotenv').config();
const { sequelize } = require('./db/connect');

async function addEmailVerificationColumns() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Checking if users table exists...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const usersTableExists = tables.some(t => t.table_name === 'users');
    
    if (!usersTableExists) {
      console.log('Users table does not exist yet. Please run the application first to create it.');
      return;
    }

    console.log('Checking existing columns in users table...');
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    const columnNames = columns.map(c => c.column_name);
    console.log('Existing columns:', columnNames);
    
    // Add isEmailVerified column if it doesn't exist
    if (!columnNames.includes('isemailverified')) {
      console.log('Adding isEmailVerified column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false
      `);
      console.log('isEmailVerified column added successfully.');
    } else {
      console.log('isEmailVerified column already exists.');
    }
    
    // Add emailVerificationToken column if it doesn't exist
    if (!columnNames.includes('emailverificationtoken')) {
      console.log('Adding emailVerificationToken column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN "emailVerificationToken" VARCHAR(255)
      `);
      console.log('emailVerificationToken column added successfully.');
    } else {
      console.log('emailVerificationToken column already exists.');
    }
    
    // Add emailVerificationExpires column if it doesn't exist
    if (!columnNames.includes('emailverificationexpires')) {
      console.log('Adding emailVerificationExpires column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN "emailVerificationExpires" TIMESTAMP WITH TIME ZONE
      `);
      console.log('emailVerificationExpires column added successfully.');
    } else {
      console.log('emailVerificationExpires column already exists.');
    }
    
    console.log('All required columns have been added successfully!');
    
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the function
addEmailVerificationColumns(); 