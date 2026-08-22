const serializeAdmin = (admin, { includeLastLogin = false } = {}) => {
  const safeAdmin = {
    id: admin._id.toString(),
    fullName: admin.fullName,
    email: admin.email,
    username: admin.username,
    role: admin.role,
    status: admin.status,
  };

  if (includeLastLogin) {
    safeAdmin.lastLoginAt = admin.lastLoginAt || null;
  }

  return safeAdmin;
};

module.exports = serializeAdmin;
