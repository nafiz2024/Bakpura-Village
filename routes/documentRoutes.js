const express = require('express');
const controller = require('../controllers/documentController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();
router.use(protectAdmin);
router.get('/stats', requirePermission(PERMISSIONS.DOCUMENTS.VIEW), controller.stats);
router.get('/', requirePermission(PERMISSIONS.DOCUMENTS.VIEW), controller.list);
router.post('/', requirePermission(PERMISSIONS.DOCUMENTS.UPLOAD), controller.create);
router.get('/:id/versions', requirePermission(PERMISSIONS.DOCUMENTS.VIEW), controller.versions);
router.post('/:id/versions', requirePermission(PERMISSIONS.DOCUMENTS.EDIT), controller.addVersion);
router.get('/:id/versions/:version', requirePermission(PERMISSIONS.DOCUMENTS.VIEW), controller.versionDetail);
router.get('/:id/download', requirePermission(PERMISSIONS.DOCUMENTS.DOWNLOAD), controller.download);
router.patch('/:id/access', requirePermission(PERMISSIONS.DOCUMENTS.CHANGE_ACCESS), controller.changeAccess);
router.post('/:id/submit-for-approval', requirePermission(PERMISSIONS.DOCUMENTS.EDIT), controller.submit);
router.post('/:id/approve', requirePermission(PERMISSIONS.DOCUMENTS.APPROVE), controller.approve);
router.post('/:id/reject', requirePermission(PERMISSIONS.DOCUMENTS.APPROVE), controller.reject);
router.post('/:id/publish', requirePermission(PERMISSIONS.DOCUMENTS.APPROVE), controller.publish);
router.post('/:id/unpublish', requirePermission(PERMISSIONS.DOCUMENTS.EDIT), controller.unpublish);
router.post('/:id/archive', requirePermission(PERMISSIONS.DOCUMENTS.DELETE), controller.archive);
router.post('/:id/restore', requirePermission(PERMISSIONS.DOCUMENTS.DELETE), controller.restore);
router.get('/:id', requirePermission(PERMISSIONS.DOCUMENTS.VIEW), controller.detail);
router.patch('/:id', requirePermission(PERMISSIONS.DOCUMENTS.EDIT), controller.update);

module.exports = router;
