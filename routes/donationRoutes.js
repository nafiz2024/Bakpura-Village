const express = require('express');
const controller = require('../controllers/donationController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();
router.use(protectAdmin);
router.get('/stats', requirePermission(PERMISSIONS.FINANCE.VIEW), controller.stats);
router.get('/', requirePermission(PERMISSIONS.FINANCE.VIEW), controller.list);
router.get('/:id', requirePermission(PERMISSIONS.FINANCE.VIEW), controller.detail);
router.post('/:id/verify', requirePermission(PERMISSIONS.FINANCE.APPROVE), controller.verify);
router.post('/:id/reject', requirePermission(PERMISSIONS.FINANCE.APPROVE), controller.reject);
module.exports = router;
