const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');
const serializeAdmin = require('../utils/adminSerializer');
const { logAuditEvent } = require('../services/auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

const COOKIE_NAME = 'bakpura_admin_token';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

const login = async (req, res) => {
  const identifier = typeof req.body.identifier === 'string' ? req.body.identifier.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Identifier and password are required' });
  }

  const admin = await Admin.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select('+password');

  if (!admin || !(await admin.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (admin.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Account access is disabled' });
  }

  const token = generateToken(admin._id);
  admin.lastLoginAt = new Date();
  await admin.save();
  await logAuditEvent({ admin, action: AUDIT_ACTIONS.AUTH.LOGIN, module: 'auth', target: { type: 'admin', id: admin._id, label: admin.username }, description: 'Admin login', request: req }).catch((error) => console.error(`Audit logging failed: ${error.message}`));

  res.cookie(COOKIE_NAME, token, getCookieOptions());
  return res.status(200).json({
    success: true,
    message: 'Login successful',
    admin: serializeAdmin(admin),
  });
};

const getCurrentAdmin = (req, res) =>
  res.status(200).json({
    success: true,
    admin: serializeAdmin(req.admin, { includeLastLogin: true }),
    permissions: req.adminPermissions,
  });

const logout = async (req, res) => {
  await logAuditEvent({ admin: req.admin, action: AUDIT_ACTIONS.AUTH.LOGOUT, module: 'auth', target: { type: 'admin', id: req.admin._id, label: req.admin.username }, description: 'Admin logout', request: req }).catch((error) => console.error(`Audit logging failed: ${error.message}`));
  res.clearCookie(COOKIE_NAME, getCookieOptions());
  return res.status(200).json({ success: true, message: 'Logout successful' });
};

module.exports = { login, getCurrentAdmin, logout };
