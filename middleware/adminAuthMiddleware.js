const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { getAdminPermissions } = require('../services/permissionService');

const unauthorized = (res) =>
  res.status(401).json({
    success: false,
    message: 'Unauthorized',
  });

const protectAdmin = async (req, res, next) => {
  let token = req.cookies?.bakpura_admin_token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  }

  if (!token) return unauthorized(res);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(payload.adminId);

    if (!admin || admin.status !== 'active') return unauthorized(res);

    req.admin = admin;
    req.adminPermissions = await getAdminPermissions(admin);
    return next();
  } catch {
    return unauthorized(res);
  }
};

module.exports = { protectAdmin };
