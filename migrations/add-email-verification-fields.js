'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the missing columns for email verification
    try {
      // Check if the table exists first
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('users')) {
        console.log('Users table does not exist yet, skipping migration');
        return Promise.resolve();
      }
      
      // Check if columns exist before adding them
      const tableDescription = await queryInterface.describeTable('users');
      
      const columnsToAdd = [];
      
      if (!tableDescription.isEmailVerified) {
        columnsToAdd.push(
          queryInterface.addColumn('users', 'isEmailVerified', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
          })
        );
      }
      
      if (!tableDescription.emailVerificationToken) {
        columnsToAdd.push(
          queryInterface.addColumn('users', 'emailVerificationToken', {
            type: Sequelize.STRING,
            allowNull: true
          })
        );
      }
      
      if (!tableDescription.emailVerificationExpires) {
        columnsToAdd.push(
          queryInterface.addColumn('users', 'emailVerificationExpires', {
            type: Sequelize.DATE,
            allowNull: true
          })
        );
      }
      
      return Promise.all(columnsToAdd);
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns if migration needs to be reversed
    try {
      // Check if the table exists first
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('users')) {
        console.log('Users table does not exist yet, skipping migration rollback');
        return Promise.resolve();
      }
      
      return Promise.all([
        queryInterface.removeColumn('users', 'isEmailVerified'),
        queryInterface.removeColumn('users', 'emailVerificationToken'),
        queryInterface.removeColumn('users', 'emailVerificationExpires')
      ]);
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
}; 