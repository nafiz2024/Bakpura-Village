require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');

const testDbConnection = async () => {
  try {
    if (!process.env.MONGO_URI || !process.env.MONGO_URI.trim()) {
      throw new Error('MongoDB URI must be added to .env before starting the server.');
    }

    await connectDB();
    console.log('MongoDB connection test succeeded');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`MongoDB connection test failed: ${error.message}`);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }

    process.exit(1);
  }
};

testDbConnection();
