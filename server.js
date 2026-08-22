require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const validateEnv = require('./utils/validateEnv');
const app = require('./app');

let server;
let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }

  process.exit(0);
};

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      console.error(`Shutdown failed: ${error.message}`);
      process.exit(1);
    });
  });
}

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();
    server = app.listen(Number(process.env.PORT), () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
