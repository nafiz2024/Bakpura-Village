const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const databaseStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bakpura Welfare API is running',
    database: databaseStates[mongoose.connection.readyState] || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
  });
});

module.exports = router;
