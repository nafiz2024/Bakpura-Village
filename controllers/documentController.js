const mongoose = require('mongoose');
const Document = require('../models/Document');
const DocumentVersion = require('../models/DocumentVersion');
const Member = require('../models/Member');
const Activity = require('../models/Activity');
const Committee = require('../models/Committee');
const FinanceTransaction = require('../models/FinanceTransaction');
const { validateDocument, validateVersion, validateReason, ACCESS_LEVELS, CATEGORIES } = require('../validators/documentValidator');
const { resourceFilterForAdmin, canAccessDocument, canChangeAccessLevel } = require('../services/documentAccessService');
const { adminDocument, adminVersion } = require('../services/documentService');

const validId = (value) => mongoose.Types.ObjectId.isValid(value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wrap = (handler) => async (req, res, next) => { try { await handler(req, res); } catch (error) { if (error.code === 11000) return res.status(409).json({ success: false, message: 'Document slug or version already exists' }); next(error); } };
const missing = (res) => res.status(404).json({ success: false, message: 'Document not found' });
const forbidden = (res) => res.status(403).json({ success: false, message: 'You do not have access to this document' });

const validateRelations = async (value, session) => {
  const checks = [
    ['relatedMember', Member, 'Related Member not found'], ['relatedActivity', Activity, 'Related Activity not found'],
    ['relatedCommittee', Committee, 'Related Committee not found'], ['relatedFinanceTransaction', FinanceTransaction, 'Related Finance transaction not found'],
  ];
  for (const [field, Model, message] of checks) if (value[field] && !await Model.exists({ _id: value[field] }).session(session || null)) return message;
  return null;
};

const canCreateResource = (admin, value) => {
  const sensitiveFinance = value.category === 'finance' || value.relatedFinanceTransaction;
  const sensitiveMember = value.category === 'member-document' || value.relatedMember;
  if (admin.role === 'super-admin') return true;
  if (sensitiveMember || value.accessLevel === 'highly-restricted') return false;
  if (admin.role === 'finance-admin') return Boolean(sensitiveFinance);
  if (admin.role === 'management-admin') return !sensitiveFinance;
  return admin.role === 'content-admin' && value.accessLevel === 'public' && !sensitiveFinance;
};

const create = wrap(async (req, res) => {
  const { errors, value } = validateDocument(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  value.accessLevel ||= 'internal';
  if (!canCreateResource(req.admin, value)) return forbidden(res);
  const relationError = await validateRelations(value);
  if (relationError) return res.status(400).json({ success: false, message: relationError });
  const session = await mongoose.startSession();
  let document;
  try {
    await session.withTransaction(async () => {
      [document] = await Document.create([{ ...value, status: 'draft', currentVersion: 1, createdBy: req.admin._id }], { session });
      await DocumentVersion.create([{ document: document._id, versionNumber: 1, file: value.file, changeNote: 'Initial version', createdBy: req.admin._id }], { session });
    });
  } finally { await session.endSession(); }
  return res.status(201).json({ success: true, data: adminDocument(document) });
});

const buildListFilter = (req) => {
  const query = {};
  for (const [field, values] of [['category', CATEGORIES], ['accessLevel', ACCESS_LEVELS], ['status', ['draft', 'pending-approval', 'approved', 'published', 'unpublished', 'archived']]]) if (req.query[field]) {
    if (!values.includes(req.query[field])) throw new Error(`Invalid ${field}`); query[field] = req.query[field];
  }
  for (const field of ['relatedMember', 'relatedActivity']) if (req.query[field]) { if (!validId(req.query[field])) throw new Error(`Invalid ${field}`); query[field] = req.query[field]; }
  if (req.query.search) {
    const search = String(req.query.search).trim(); if (search.length > 160) throw new Error('Search is too long');
    const regex = new RegExp(escapeRegex(search), 'i'); query.$or = [{ title: regex }, { titleBn: regex }, { description: regex }, { category: regex }];
  }
  if (req.query.year) {
    const year = Number(req.query.year); if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error('Invalid year');
    query.createdAt = { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) };
  }
  return query;
};

const authorizedFilter = (req, filter = {}) => ({ $and: [resourceFilterForAdmin(req.admin), filter] });

const list = wrap(async (req, res) => {
  const page = Number(req.query.page || 1), limit = Math.min(Number(req.query.limit || 20), 100);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) return res.status(400).json({ success: false, message: 'Invalid pagination' });
  let requested; try { requested = buildListFilter(req); } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
  const sorts = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, 'title-asc': { title: 1 }, 'title-desc': { title: -1 } }, sort = sorts[req.query.sort || 'newest'];
  if (!sort) return res.status(400).json({ success: false, message: 'Invalid sort' });
  const filter = authorizedFilter(req, requested);
  const [data, total] = await Promise.all([Document.find(filter).sort(sort).skip((page - 1) * limit).limit(limit), Document.countDocuments(filter)]);
  return res.json({ success: true, data: data.map(adminDocument), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const stats = wrap(async (req, res) => {
  const base = resourceFilterForAdmin(req.admin);
  const queries = { total: {}, draft: { status: 'draft' }, pendingApproval: { status: 'pending-approval' }, approved: { status: 'approved' }, published: { status: 'published' }, archived: { status: 'archived' }, public: { accessLevel: 'public' }, internal: { accessLevel: 'internal' }, restricted: { accessLevel: 'restricted' }, highlyRestricted: { accessLevel: 'highly-restricted' } };
  const counts = await Promise.all(Object.values(queries).map((query) => Document.countDocuments({ $and: [base, query] })));
  return res.json({ success: true, data: Object.fromEntries(Object.keys(queries).map((key, index) => [key, counts[index]])) });
});

const getAuthorized = async (req, action) => {
  const document = validId(req.params.id) && await Document.findById(req.params.id);
  if (!document) return { status: 404 };
  if (!canAccessDocument(req.admin, req.adminPermissions, document, action)) return { status: 403 };
  return { document };
};

const detail = wrap(async (req, res) => {
  const result = await getAuthorized(req, 'view'); if (result.status === 404) return missing(res); if (result.status === 403) return forbidden(res);
  const versions = await DocumentVersion.find({ document: result.document._id }).select('versionNumber file.originalName file.mimeType file.extension file.size changeNote createdBy createdAt').sort({ versionNumber: -1 });
  result.document.viewCount += 1; await result.document.save();
  return res.json({ success: true, data: { document: adminDocument(result.document), versions: versions.map(adminVersion) } });
});

const update = wrap(async (req, res) => {
  const result = await getAuthorized(req, 'edit'); if (result.status === 404) return missing(res); if (result.status === 403) return forbidden(res);
  const { errors, value } = validateDocument(req.body, { partial: true });
  delete value.file; delete value.accessLevel;
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  const candidate = { ...result.document.toObject(), ...value };
  if (!canAccessDocument(req.admin, req.adminPermissions, candidate, 'edit')) return forbidden(res);
  const relationError = await validateRelations(value); if (relationError) return res.status(400).json({ success: false, message: relationError });
  Object.assign(result.document, value, { updatedBy: req.admin._id }); await result.document.save();
  return res.json({ success: true, data: adminDocument(result.document) });
});

const changeAccess = wrap(async (req, res) => {
  if (!ACCESS_LEVELS.includes(req.body.accessLevel)) return res.status(400).json({ success: false, message: 'Invalid accessLevel' });
  const document = validId(req.params.id) && await Document.findById(req.params.id); if (!document) return missing(res);
  if (!canChangeAccessLevel(req.admin, req.adminPermissions, document, req.body.accessLevel)) return forbidden(res);
  res.locals.auditChanges = { accessLevel: { from: document.accessLevel, to: req.body.accessLevel } };
  if (document.status === 'published' && req.body.accessLevel !== 'public') document.status = 'unpublished';
  document.accessLevel = req.body.accessLevel; document.updatedBy = req.admin._id; await document.save();
  return res.json({ success: true, data: adminDocument(document) });
});

const addVersion = wrap(async (req, res) => {
  const result = await getAuthorized(req, 'edit'); if (result.status === 404) return missing(res); if (result.status === 403) return forbidden(res);
  const { errors, value } = validateVersion(req.body); if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  const session = await mongoose.startSession(); let version;
  try {
    await session.withTransaction(async () => {
      const current = await Document.findOneAndUpdate({ _id: result.document._id, currentVersion: result.document.currentVersion }, { $inc: { currentVersion: 1 }, $set: { file: value.file, updatedBy: req.admin._id } }, { returnDocument: 'after', session });
      if (!current) throw Object.assign(new Error('Document version changed; retry the request'), { statusCode: 409 });
      [version] = await DocumentVersion.create([{ document: current._id, versionNumber: current.currentVersion, file: value.file, changeNote: value.changeNote, createdBy: req.admin._id }], { session });
    });
  } catch (error) { if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message }); throw error; } finally { await session.endSession(); }
  return res.status(201).json({ success: true, data: adminVersion(version) });
});

const versions = wrap(async (req, res) => {
  const result = await getAuthorized(req, 'view'); if (result.status === 404) return missing(res); if (result.status === 403) return forbidden(res);
  const data = await DocumentVersion.find({ document: result.document._id }).sort({ versionNumber: -1 });
  return res.json({ success: true, data: data.map(adminVersion) });
});

const versionDetail = wrap(async (req, res) => {
  const result = await getAuthorized(req, 'view'); if (result.status === 404) return missing(res); if (result.status === 403) return forbidden(res);
  const number = Number(req.params.version); if (!Number.isInteger(number) || number < 1) return res.status(400).json({ success: false, message: 'Invalid version' });
  const version = await DocumentVersion.findOne({ document: result.document._id, versionNumber: number });
  if (!version) return res.status(404).json({ success: false, message: 'Document version not found' });
  return res.json({ success: true, data: adminVersion(version) });
});

const download = wrap(async (req, res) => {
  const result = await getAuthorized(req, 'download'); if (result.status === 404) return missing(res); if (result.status === 403) return forbidden(res);
  result.document.downloadCount += 1; await result.document.save();
  return res.json({ success: true, data: { file: result.document.file, version: result.document.currentVersion } });
});

const transition = (action) => wrap(async (req, res) => {
  const permissionAction = ['approve', 'reject'].includes(action) ? 'approve' : action === 'publish' ? 'changeAccess' : action === 'archive' || action === 'restore' ? 'edit' : 'edit';
  const result = await getAuthorized(req, permissionAction); if (result.status === 404) return missing(res); if (result.status === 403) return forbidden(res);
  const document = result.document;
  if (action === 'submit' && document.status !== 'draft') return res.status(409).json({ success: false, message: 'Only draft documents can be submitted' });
  if (action === 'approve' && document.status !== 'pending-approval') return res.status(409).json({ success: false, message: 'Only pending documents can be approved' });
  if (action === 'reject') { if (document.status !== 'pending-approval') return res.status(409).json({ success: false, message: 'Only pending documents can be rejected' }); const validation = validateReason(req.body); if (validation.errors.length) return res.status(400).json({ success: false, message: validation.errors.join('; ') }); document.status = 'draft'; document.rejectionReason = validation.value; document.rejectedAt = new Date(); document.rejectedBy = req.admin._id; }
  if (action === 'publish' && (document.status !== 'approved' || document.accessLevel !== 'public' || !document.slug || !document.file?.url)) return res.status(409).json({ success: false, message: 'Publishing requires an approved public document with slug and file reference' });
  if (action === 'unpublish' && document.status !== 'published') return res.status(409).json({ success: false, message: 'Only published documents can be unpublished' });
  if (action === 'restore' && document.status !== 'archived') return res.status(409).json({ success: false, message: 'Only archived documents can be restored' });
  if (action === 'submit') document.status = 'pending-approval';
  if (action === 'approve') { document.status = 'approved'; document.approvedAt = new Date(); document.approvedBy = req.admin._id; }
  if (action === 'publish') { document.status = 'published'; document.publishedAt = new Date(); document.publishedBy = req.admin._id; }
  if (action === 'unpublish') document.status = 'unpublished';
  if (action === 'archive') { document.status = 'archived'; document.archivedAt = new Date(); document.archivedBy = req.admin._id; }
  if (action === 'restore') { document.status = 'draft'; document.archivedAt = undefined; document.archivedBy = null; }
  document.updatedBy = req.admin._id; await document.save(); return res.json({ success: true, data: adminDocument(document) });
});

module.exports = { create, list, stats, detail, update, changeAccess, addVersion, versions, versionDetail, download, submit: transition('submit'), approve: transition('approve'), reject: transition('reject'), publish: transition('publish'), unpublish: transition('unpublish'), archive: transition('archive'), restore: transition('restore') };
