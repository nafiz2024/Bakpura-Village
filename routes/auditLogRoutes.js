const express = require('express');
const controller = require('../controllers/auditLogController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();
router.use(protectAdmin);
router.get('/stats', requirePermission(PERMISSIONS.AUDIT.VIEW), controller.stats);
router.get('/export', requirePermission(PERMISSIONS.AUDIT.EXPORT), controller.exportLogs);
router.get('/', requirePermission(PERMISSIONS.AUDIT.VIEW), controller.list);
router.get('/:id', requirePermission(PERMISSIONS.AUDIT.VIEW), controller.detail);
module.exports = router;
