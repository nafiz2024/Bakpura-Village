const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ALL_AUDIT_ACTIONS } = require('../constants/auditActions');
const { sanitizeAuditData } = require('../utils/sanitizeAuditData');

const MODULES = new Set(['auth', 'admins', 'roles', 'members', 'applications', 'committee', 'activities', 'news', 'gallery', 'contact', 'donations', 'finance', 'documents', 'settings']);

const logAuditEvent = async ({ admin, action, module, target, changes, description, result = 'success', request, session }) => {
  if (!admin?._id || !ALL_AUDIT_ACTIONS.includes(action) || !MODULES.has(module)) throw new Error('Invalid controlled audit event');
  const safeTarget = target ? {
    type: target.type ? String(target.type).slice(0, 100) : undefined,
    id: mongoose.Types.ObjectId.isValid(target.id) ? String(target.id) : undefined,
    label: target.label ? String(target.label).slice(0, 200) : undefined,
  } : undefined;
  const entry = {
    actor: { adminId: admin._id, fullName: admin.fullName, username: admin.username, role: admin.role },
    action, module, target: safeTarget, result,
    description: description ? String(description).slice(0, 300) : undefined,
    changes: changes ? sanitizeAuditData(changes) : undefined,
    metadata: request ? sanitizeAuditData({ requestId: request.requestId, route: request.originalUrl?.split('?')[0], method: request.method, ip: request.ip, userAgent: request.get?.('user-agent') }) : undefined,
  };
  const [created] = await AuditLog.create([entry], session ? { session } : undefined);
  return created;
};

module.exports = { logAuditEvent };
