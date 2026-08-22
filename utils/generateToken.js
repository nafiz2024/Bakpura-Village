const jwt = require('jsonwebtoken');

const generateToken = (adminId) =>
  jwt.sign({ adminId: adminId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

module.exports = generateToken;
