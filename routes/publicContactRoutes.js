const express = require('express');
const { submitContact } = require('../controllers/publicContactController');
const contactRateLimiter = require('../middleware/contactRateLimiter');

const router = express.Router();

router.post('/', contactRateLimiter, submitContact);

module.exports = router;
