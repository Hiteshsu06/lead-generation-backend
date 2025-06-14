require('dotenv').config();
const { sequelize } = require('./db/connect');

async function updateUserRoles() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Get the default user role ID
    console.log('Finding default user role...');
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
      
      // Get the newly created user role
      const [newUserRole] = await sequelize.query(`
        SELECT id FROM roles WHERE name = 'user' LIMIT 1
      `);
      
      if (newUserRole.length === 0) {
        throw new Error('Failed to create default user role');
      }
      
      userRoleId = newUserRole[0].id;
    } else {
      userRoleId = userRole[0].id;
    }
    
    console.log(`Default user role ID: ${userRoleId}`);
    
    // Update users with null roleId to have the default user role
    console.log('Updating users with null roleId...');
    const result = await sequelize.query(`
      UPDATE users
      SET "roleId" = ${userRoleId}
      WHERE "roleId" IS NULL
      RETURNING id
    `);
    
    const updatedCount = result[1]?.rowCount || 0;
    console.log(`Updated ${updatedCount} users with default user role.`);
    
    console.log('User roles have been updated successfully!');
    
  } catch (error) {
    console.error('Error updating user roles:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the function
updateUserRoles(); 