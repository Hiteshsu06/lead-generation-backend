require('dotenv').config();
const { sequelize } = require('./db/connect');

async function fixAllDatabaseIssues() {
  try {
    console.log('========== DATABASE FIX SCRIPT ==========');
    console.log('This script will fix all known database issues:');
    console.log('1. Add missing email verification columns');
    console.log('2. Add missing user profile columns');
    console.log('3. Create roles table if it doesn\'t exist');
    console.log('4. Assign default role to users');
    console.log('========================================');
    
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Step 1: Check if users table exists
    console.log('\n--- STEP 1: Checking tables ---');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const usersTableExists = tables.some(t => t.table_name === 'users');
    const rolesTableExists = tables.some(t => t.table_name === 'roles');
    
    console.log('Users table exists:', usersTableExists);
    console.log('Roles table exists:', rolesTableExists);
    
    if (!usersTableExists) {
      console.log('Users table does not exist yet. Please run the application first to create it.');
      return;
    }

    // Step 2: Check existing columns in users table
    console.log('\n--- STEP 2: Checking existing columns ---');
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    const columnNames = columns.map(c => c.column_name.toLowerCase());
    console.log('Existing columns:', columnNames);
    
    // Step 3: Define all required columns
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
    
    // Step 4: Create roles table if it doesn't exist yet
    let userRoleId = null;
    if (!rolesTableExists) {
      console.log('\n--- STEP 4: Creating roles table ---');
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
        RETURNING id
      `);
      
      console.log('Roles table created and initialized successfully.');
      
      // Get the user role ID
      const [userRole] = await sequelize.query(`
        SELECT id FROM roles WHERE name = 'user' LIMIT 1
      `);
      
      if (userRole.length > 0) {
        userRoleId = userRole[0].id;
        console.log(`Default user role ID: ${userRoleId}`);
      }
    } else {
      // Get the user role ID if roles table exists
      const [userRole] = await sequelize.query(`
        SELECT id FROM roles WHERE name = 'user' LIMIT 1
      `);
      
      if (userRole.length === 0) {
        console.log('Default user role not found. Creating it...');
        await sequelize.query(`
          INSERT INTO roles (name, description, permissions, "createdAt", "updatedAt")
          VALUES ('user', 'Regular user with basic permissions', '{}', NOW(), NOW())
          RETURNING id
        `);
        
        const [newUserRole] = await sequelize.query(`
          SELECT id FROM roles WHERE name = 'user' LIMIT 1
        `);
        
        if (newUserRole.length > 0) {
          userRoleId = newUserRole[0].id;
          console.log(`Created default user role with ID: ${userRoleId}`);
        }
      } else {
        userRoleId = userRole[0].id;
        console.log(`Found existing default user role with ID: ${userRoleId}`);
      }
    }
    
    // Step 5: Add missing columns to users table
    console.log('\n--- STEP 5: Adding missing columns to users table ---');
    for (const column of requiredColumns) {
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
    
    // Step 6: Update users with null roleId to have the default user role
    if (userRoleId) {
      console.log('\n--- STEP 6: Updating user roles ---');
      const result = await sequelize.query(`
        UPDATE users
        SET "roleId" = ${userRoleId}
        WHERE "roleId" IS NULL
        RETURNING id
      `);
      
      const updatedCount = result[1]?.rowCount || 0;
      console.log(`Updated ${updatedCount} users with default user role.`);
    }
    
    console.log('\n========== ALL FIXES COMPLETED SUCCESSFULLY ==========');
    
  } catch (error) {
    console.error('Error fixing database issues:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the function
fixAllDatabaseIssues(); 