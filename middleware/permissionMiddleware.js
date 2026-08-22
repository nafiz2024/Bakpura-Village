const { getAdminPermissions } = require('../services/permissionService');

const denied = (res) =>
  res.status(403).json({
    success: false,
    message: 'You do not have permission to perform this action',
  });

const ensureAuthenticatedAdmin = (req, res) => {
  if (!req.admin || req.admin.status !== 'active') {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return false;
  }
  return true;
};

const requireRole = (...roles) => (req, res, next) => {
  if (!ensureAuthenticatedAdmin(req, res)) return;
  if (!roles.includes(req.admin.role)) return denied(res);
  return next();
};

const resolvePermissions = async (req) => {
  if (!req.adminPermissions) {
    req.adminPermissions = await getAdminPermissions(req.admin);
  }
  return new Set(req.adminPermissions);
};

const requireAllPermissions = (...requiredPermissions) => async (req, res, next) => {
  if (!ensureAuthenticatedAdmin(req, res)) return;
  const permissions = await resolvePermissions(req);
  if (!requiredPermissions.every((permission) => permissions.has(permission))) return denied(res);
  return next();
};

const requireAnyPermission = (...requiredPermissions) => async (req, res, next) => {
  if (!ensureAuthenticatedAdmin(req, res)) return;
  const permissions = await resolvePermissions(req);
  if (!requiredPermissions.some((permission) => permissions.has(permission))) return denied(res);
  return next();
};

const requirePermission = (permission) => requireAllPermissions(permission);

module.exports = {
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
};
