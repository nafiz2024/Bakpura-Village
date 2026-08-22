const mongoose = require('mongoose');
const { ALL_AUDIT_ACTIONS } = require('../constants/auditActions');

const auditLogSchema = new mongoose.Schema({
  actor: {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
  },
  action: { type: String, required: true, enum: ALL_AUDIT_ACTIONS },
  module: { type: String, required: true, enum: ['auth', 'admins', 'roles', 'members', 'applications', 'committee', 'activities', 'news', 'gallery', 'contact', 'donations', 'finance', 'documents', 'settings'] },
  target: { type: { type: String, trim: true }, id: { type: mongoose.Schema.Types.ObjectId }, label: { type: String, trim: true, maxlength: 200 } },
  result: { type: String, enum: ['success', 'failure'], default: 'success' },
  description: { type: String, trim: true, maxlength: 300 },
  changes: { type: mongoose.Schema.Types.Mixed },
  metadata: { requestId: String, route: String, method: String, ip: String, userAgent: String },
  createdAt: { type: Date, default: Date.now, immutable: true },
}, { versionKey: false, timestamps: false, strict: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ 'actor.adminId': 1, createdAt: -1 });
auditLogSchema.index({ 'target.type': 1, 'target.id': 1, createdAt: -1 });
auditLogSchema.index({ result: 1, createdAt: -1 });

const immutable = function immutableAuditLog() { throw new Error('Audit logs are append-only'); };
for (const hook of ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete']) auditLogSchema.pre(hook, immutable);

module.exports = mongoose.model('AuditLog', auditLogSchema);
