const mongoose = require('mongoose');
const config = require('./config');

// Test MongoDB connection
async function testConnection() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('MongoDB connection successful!');
    console.log(`Connected to: ${config.MONGODB_URI}`);
    
    // Create a simple test collection
    const testCollection = mongoose.connection.collection('test');
    await testCollection.insertOne({ message: 'MongoDB is working properly', timestamp: new Date() });
    console.log('Test document created successfully');
    
    const testDoc = await testCollection.findOne({ message: 'MongoDB is working properly' });
    console.log('Test document retrieved:', testDoc);
    
    console.log('\nMongoDB setup is complete. You can now run the API server.');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    console.log('\nPlease check that:');
    console.log('1. MongoDB is installed and running');
    console.log('2. The connection URI in .env or config.js is correct');
  } finally {
    await mongoose.disconnect();
  }
}

testConnection(); 