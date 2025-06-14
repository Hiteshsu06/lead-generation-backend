const { Sequelize } = require('sequelize');
const config = require('./config');

// Create a test connection to default 'postgres' database first
const testConnection = async () => {
  // First connect to the default postgres database to create our DB if needed
  const adminSequelize = new Sequelize(
    'postgres', // Default database that always exists
    config.DB.USER,
    config.DB.PASSWORD,
    {
      host: config.DB.HOST,
      dialect: config.DB.DIALECT,
      logging: false
    }
  );

  try {
    // Test the initial connection
    await adminSequelize.authenticate();
    console.log('✅ PostgreSQL connection has been established successfully.');
    
    // Create the database if it doesn't exist
    try {
      await adminSequelize.query(`CREATE DATABASE ${config.DB.DATABASE};`);
      console.log(`✅ Database '${config.DB.DATABASE}' created successfully.`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`ℹ️ Database '${config.DB.DATABASE}' already exists.`);
      } else {
        console.error(`❌ Error creating database: ${error.message}`);
      }
    }
    
    // Close the admin connection
    await adminSequelize.close();
    
    // Now connect to our actual database
    const appSequelize = new Sequelize(
      config.DB.DATABASE,
      config.DB.USER,
      config.DB.PASSWORD,
      {
        host: config.DB.HOST,
        dialect: config.DB.DIALECT,
        logging: false
      }
    );
    
    // Test the connection to our database
    await appSequelize.authenticate();
    console.log(`✅ Connected to '${config.DB.DATABASE}' database successfully.`);
    
    // Test database operations
    try {
      // Create a test table
      await appSequelize.query(`
        CREATE TABLE IF NOT EXISTS connection_test (
          id SERIAL PRIMARY KEY,
          message VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Test table created successfully.');
      
      // Insert a test record
      await appSequelize.query(`
        INSERT INTO connection_test (message) 
        VALUES ('PostgreSQL is working properly!');
      `);
      console.log('✅ Test record inserted successfully.');
      
      // Retrieve the test record
      const [results] = await appSequelize.query('SELECT * FROM connection_test;');
      console.log('✅ Test query executed successfully:');
      console.log(results);
      
    } catch (error) {
      console.error('❌ Error testing database operations:', error.message);
    }
    
    // Close the app connection
    await appSequelize.close();
    
    console.log('\n✅ PostgreSQL setup is complete. You can now run the API server.');
    console.log('Run the following command to start the server:');
    console.log('npm run dev');
    
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error.message);
    console.log('\nPlease check that:');
    console.log('1. PostgreSQL is installed and running');
    console.log('2. The connection details in config.js are correct:');
    console.log(`   - Host: ${config.DB.HOST}`);
    console.log(`   - User: ${config.DB.USER}`);
    console.log(`   - Password: ${config.DB.PASSWORD}`);
    console.log(`   - Database: postgres (default database)`);
    console.log(`   - Port: 5432 (default)`);
  }
};

testConnection(); 