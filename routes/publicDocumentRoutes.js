const express = require('express');
const controller = require('../controllers/publicDocumentController');

const router = express.Router();
router.get('/', controller.list);
router.get('/:slug', controller.detail);
module.exports = router;
