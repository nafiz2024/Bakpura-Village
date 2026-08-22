const Role = require('../models/Role');
const { ALL_PERMISSIONS } = require('../constants/permissions');
const { ROLE_PERMISSIONS } = require('../constants/rolePermissions');

const getAdminPermissions = async (admin) => {
  if (!admin || admin.status !== 'active') return [];
  if (admin.role === 'super-admin') return [...ALL_PERMISSIONS];

  const role = await Role.findOne({ name: admin.role, isActive: true }).select('permissions').lean();
  const permissions = role?.permissions || ROLE_PERMISSIONS[admin.role] || [];

  return [...new Set(permissions)];
};

module.exports = { getAdminPermissions };
