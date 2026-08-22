const express = require('express');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');
const {
  createMember,
  listMembers,
  getMemberDetails,
  updateMember,
  updateMemberStatus,
  archiveMember,
  restoreMember,
  getMemberStats,
} = require('../controllers/memberController');

const router = express.Router();

router.use(protectAdmin);
router.get('/stats', requirePermission(PERMISSIONS.MEMBERS.VIEW), getMemberStats);
router
  .route('/')
  .get(requirePermission(PERMISSIONS.MEMBERS.VIEW), listMembers)
  .post(requirePermission(PERMISSIONS.MEMBERS.CREATE), createMember);
router.patch('/:id/status', requirePermission(PERMISSIONS.MEMBERS.EDIT), updateMemberStatus);
router.post('/:id/archive', requirePermission(PERMISSIONS.MEMBERS.ARCHIVE), archiveMember);
router.post('/:id/restore', requirePermission(PERMISSIONS.MEMBERS.ARCHIVE), restoreMember);
router
  .route('/:id')
  .get(requirePermission(PERMISSIONS.MEMBERS.VIEW), getMemberDetails)
  .patch(requirePermission(PERMISSIONS.MEMBERS.EDIT), updateMember);

module.exports = router;
