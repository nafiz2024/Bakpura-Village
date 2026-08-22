const mongoose = require('mongoose');

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error(`MongoDB error: ${error.message}`);
});

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MongoDB URI must be added to .env before starting the server.');
  }

  try {
    const connection = await mongoose.connect(mongoUri);
    const { host, name } = connection.connection;
    console.log(`MongoDB connected: ${host}/${name}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
