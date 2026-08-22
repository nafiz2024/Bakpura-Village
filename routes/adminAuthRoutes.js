const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { login, getCurrentAdmin, logout } = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.',
    }),
});

router.post('/login', loginLimiter, login);
router.get('/me', protectAdmin, getCurrentAdmin);
router.post('/logout', logout);

module.exports = router;
