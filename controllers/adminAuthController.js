const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');
const serializeAdmin = require('../utils/adminSerializer');

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
  });

const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, getCookieOptions());
  return res.status(200).json({ success: true, message: 'Logout successful' });
};

module.exports = { login, getCurrentAdmin, logout };
