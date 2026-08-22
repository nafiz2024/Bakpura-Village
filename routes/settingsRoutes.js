const express = require('express');
const controller = require('../controllers/settingsController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();
router.use(protectAdmin);
router.get('/', requirePermission(PERMISSIONS.SETTINGS.VIEW), controller.getAll);
router.get('/:section', requirePermission(PERMISSIONS.SETTINGS.VIEW), controller.getSection);
router.patch('/:section', requirePermission(PERMISSIONS.SETTINGS.MANAGE), controller.updateSection);
module.exports = router;
