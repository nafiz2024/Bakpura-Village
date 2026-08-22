const mongoose = require('mongoose');
const { ALL_AUDIT_ACTIONS } = require('../constants/auditActions');

const MODULES = Object.freeze(['auth', 'admins', 'roles', 'members', 'applications', 'committee', 'activities', 'news', 'gallery', 'contact', 'donations', 'finance', 'documents', 'settings']);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const validateAuditQuery = (query, { exportMode = false } = {}) => {
  const errors = [], filter = {};
  const page = Number(query.page || 1), maxLimit = exportMode ? 5000 : 100, defaultLimit = exportMode ? 1000 : 20;
  const limit = Math.min(Number(query.limit || defaultLimit), maxLimit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) errors.push('Invalid pagination');
  if (query.module) { if (!MODULES.includes(query.module)) errors.push('Invalid module'); else filter.module = query.module; }
  if (query.action) { if (!ALL_AUDIT_ACTIONS.includes(query.action)) errors.push('Invalid action'); else filter.action = query.action; }
  if (query.result) { if (!['success', 'failure'].includes(query.result)) errors.push('Invalid result'); else filter.result = query.result; }
  for (const [parameter, field] of [['adminId', 'actor.adminId'], ['targetId', 'target.id']]) if (query[parameter]) { if (!mongoose.Types.ObjectId.isValid(query[parameter])) errors.push(`Invalid ${parameter}`); else filter[field] = query[parameter]; }
  if (query.targetType) { const value = String(query.targetType).trim(); if (!/^[a-z][a-z0-9-]{0,49}$/.test(value)) errors.push('Invalid targetType'); else filter['target.type'] = value; }
  if (query.search) { const search = String(query.search).trim(); if (search.length > 160) errors.push('Search is too long'); else { const regex = new RegExp(escapeRegex(search), 'i'); filter.$or = [{ 'actor.fullName': regex }, { 'actor.username': regex }, { 'target.label': regex }, { description: regex }, { action: regex }]; } }
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) { const date = new Date(query.startDate); if (Number.isNaN(date.getTime())) errors.push('Invalid startDate'); else filter.createdAt.$gte = date; }
    if (query.endDate) { const date = new Date(query.endDate); if (Number.isNaN(date.getTime())) errors.push('Invalid endDate'); else filter.createdAt.$lte = date; }
  }
  const sorts = { newest: { createdAt: -1 }, oldest: { createdAt: 1 } }, sort = sorts[query.sort || 'newest'];
  if (!sort) errors.push('Invalid sort');
  return { errors, filter, page, limit, sort };
};

module.exports = { MODULES, validateAuditQuery };
