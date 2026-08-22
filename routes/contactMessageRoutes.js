const express = require('express');
const controller = require('../controllers/contactMessageController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();
const view = requirePermission(PERMISSIONS.CONTACT.VIEW);
const manage = requirePermission(PERMISSIONS.CONTACT.MANAGE);

router.use(protectAdmin);
router.get('/stats', view, controller.stats);
router.get('/', view, controller.list);
router.get('/:id', view, controller.detail);
router.patch('/:id/read', manage, controller.markRead);
router.patch('/:id/status', manage, controller.updateStatus);
router.patch('/:id/priority', manage, controller.updatePriority);
router.patch('/:id/assign', manage, controller.assign);
router.post('/:id/notes', manage, controller.addNote);
router.post('/:id/archive', manage, controller.archive);
router.post('/:id/restore', manage, controller.restore);

module.exports = router;
