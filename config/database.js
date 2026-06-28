const mongoose = require('mongoose');

// ================================================================
// MONGODB CONNECTION SETUP
// ================================================================
// - Reads connection string from process.env.MONGO_URI
// - Backend must start even if MongoDB is temporarily unavailable
// - Logs error but does not crash the application
// ================================================================

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGO_URI environment variable is not defined');
      console.log('⚠️  Server will start but database operations will fail');
      return;
    }

    await mongoose.connect(mongoURI);

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Server will continue but database operations will fail');
    // DO NOT crash - allow server to start
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

module.exports = connectDB;
