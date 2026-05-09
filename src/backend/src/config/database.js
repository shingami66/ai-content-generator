const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not defined in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000, // Increased timeout to 30s
      family: 4 // Force IPv4 to avoid DNS timeout issues
    });

    console.log('========================================');
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📚 Database: ${mongoose.connection.name}`);
    console.log('========================================');

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Stack:', error.stack);
    // Exit process with failure
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Connection Error:', err);
});

// Initialize on module load
connectDB();

module.exports = mongoose;