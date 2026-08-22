const express = require('express');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const {
  requireRole,
  requirePermission,
} = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

const router = express.Router();

router.get('/authenticated', protectAdmin, (req, res) => {
  res.status(200).json({ success: true, message: 'Authenticated Admin access granted' });
});

router.get('/super-admin', protectAdmin, requireRole('super-admin'), (req, res) => {
  res.status(200).json({ success: true, message: 'Super Admin access granted' });
});

router.get(
  '/members',
  protectAdmin,
  requirePermission(PERMISSIONS.MEMBERS.VIEW),
  (req, res) => res.status(200).json({ success: true, message: 'Members view access granted' }),
);

router.get(
  '/finance',
  protectAdmin,
  requirePermission(PERMISSIONS.FINANCE.VIEW),
  (req, res) => res.status(200).json({ success: true, message: 'Finance view access granted' }),
);

module.exports = router;
