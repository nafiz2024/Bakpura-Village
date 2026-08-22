const express = require('express');
const { submit } = require('../controllers/publicDonationController');
const donationRateLimiter = require('../middleware/donationRateLimiter');

const router = express.Router();
router.post('/', donationRateLimiter, submit);
module.exports = router;
