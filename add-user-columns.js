require('dotenv').config();
const { sequelize } = require('./db/connect');

async function addMissingUserColumns() {
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
    
    const columnNames = columns.map(c => c.column_name.toLowerCase());
    console.log('Existing columns:', columnNames);
    
    // Check if roles table exists before adding roleId
    const rolesTableExists = tables.some(t => t.table_name === 'roles');
    console.log('Roles table exists:', rolesTableExists);
    
    // All the columns that should be in the users table based on the User model
    const requiredColumns = [
      { name: 'isEmailVerified', type: 'BOOLEAN NOT NULL DEFAULT false' },
      { name: 'emailVerificationToken', type: 'VARCHAR(255)' },
      { name: 'emailVerificationExpires', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'phoneNumber', type: 'VARCHAR(255)' },
      { name: 'photo', type: 'VARCHAR(255)' },
      { name: 'linkedinId', type: 'VARCHAR(255)' },
      { name: 'address', type: 'TEXT' },
      { name: 'resetPasswordToken', type: 'VARCHAR(255)' },
      { name: 'resetPasswordExpires', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'roleId', type: 'INTEGER' }
    ];
    
    // Add each missing column
    for (const column of requiredColumns) {
      // Skip roleId if roles table doesn't exist
      if (column.name === 'roleId' && !rolesTableExists) {
        console.log('Skipping roleId column as roles table does not exist yet.');
        continue;
      }
      
      if (!columnNames.includes(column.name.toLowerCase())) {
        console.log(`Adding ${column.name} column...`);
        await sequelize.query(`
          ALTER TABLE users 
          ADD COLUMN "${column.name}" ${column.type}
        `);
        console.log(`${column.name} column added successfully.`);
      } else {
        console.log(`${column.name} column already exists.`);
      }
    }
    
    // Initialize roles table if it doesn't exist yet
    if (!rolesTableExists) {
      console.log('Creating roles table...');
      await sequelize.query(`
        CREATE TABLE roles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description VARCHAR(255),
          permissions JSON,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `);
      
      // Insert default roles
      console.log('Inserting default roles...');
      await sequelize.query(`
        INSERT INTO roles (name, description, permissions, "createdAt", "updatedAt")
        VALUES 
          ('user', 'Regular user with basic permissions', '{}', NOW(), NOW()),
          ('admin', 'Administrator with management permissions', '{}', NOW(), NOW()),
          ('super_admin', 'Super administrator with full system access', '{}', NOW(), NOW())
      `);
      
      console.log('Roles table created and initialized successfully.');
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
addMissingUserColumns(); 