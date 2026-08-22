const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { validateAuditQuery } = require('../validators/auditLogValidator');

const serialize = (log, admin) => {
  const value = log.toObject ? log.toObject() : log;
  if (admin.role !== 'super-admin' && value.metadata) value.metadata = { requestId: value.metadata.requestId, route: value.metadata.route, method: value.metadata.method };
  return value;
};

const list = async (req, res, next) => {
  try {
    const parsed = validateAuditQuery(req.query);
    if (parsed.errors.length) return res.status(400).json({ success: false, message: parsed.errors.join('; ') });
    const [data, total] = await Promise.all([AuditLog.find(parsed.filter).sort(parsed.sort).skip((parsed.page - 1) * parsed.limit).limit(parsed.limit), AuditLog.countDocuments(parsed.filter)]);
    return res.json({ success: true, data: data.map((log) => serialize(log, req.admin)), pagination: { page: parsed.page, limit: parsed.limit, total, pages: Math.ceil(total / parsed.limit) } });
  } catch (error) { return next(error); }
};

const stats = async (req, res, next) => {
  try {
    const now = new Date(), today = new Date(now); today.setHours(0, 0, 0, 0); const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [total, todayCount, last7DaysCount, successCount, failureCount, byModule] = await Promise.all([
      AuditLog.countDocuments(), AuditLog.countDocuments({ createdAt: { $gte: today } }), AuditLog.countDocuments({ createdAt: { $gte: last7Days } }),
      AuditLog.countDocuments({ result: 'success' }), AuditLog.countDocuments({ result: 'failure' }), AuditLog.aggregate([{ $match: { createdAt: { $gte: last7Days } } }, { $group: { _id: '$module', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);
    return res.json({ success: true, data: { total, today: todayCount, last7Days: last7DaysCount, successCount, failureCount, recentByModule: Object.fromEntries(byModule.map((row) => [row._id, row.count])) } });
  } catch (error) { return next(error); }
};

const detail = async (req, res, next) => {
  try {
    const log = mongoose.Types.ObjectId.isValid(req.params.id) && await AuditLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });
    return res.json({ success: true, data: serialize(log, req.admin) });
  } catch (error) { return next(error); }
};

const exportLogs = async (req, res, next) => {
  try {
    const parsed = validateAuditQuery(req.query, { exportMode: true });
    if (parsed.errors.length) return res.status(400).json({ success: false, message: parsed.errors.join('; ') });
    const data = await AuditLog.find(parsed.filter).sort(parsed.sort).limit(parsed.limit);
    return res.json({ success: true, format: 'json', count: data.length, limit: parsed.limit, data: data.map((log) => serialize(log, req.admin)) });
  } catch (error) { return next(error); }
};

module.exports = { list, stats, detail, exportLogs };
