const Document = require('../models/Document');
const { publicDocument } = require('../services/documentService');
const { CATEGORIES } = require('../validators/documentValidator');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wrap = (handler) => async (req, res, next) => { try { await handler(req, res); } catch (error) { next(error); } };

const list = wrap(async (req, res) => {
  const page = Number(req.query.page || 1), limit = Math.min(Number(req.query.limit || 20), 100);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) return res.status(400).json({ success: false, message: 'Invalid pagination' });
  const filter = { accessLevel: 'public', status: 'published', relatedMember: null, relatedFinanceTransaction: null, category: { $nin: ['finance', 'member-document'] } };
  if (req.query.category) { if (!CATEGORIES.includes(req.query.category) || ['finance', 'member-document'].includes(req.query.category)) return res.status(400).json({ success: false, message: 'Invalid category' }); filter.category = req.query.category; }
  if (req.query.search) { const search = String(req.query.search).trim(); if (search.length > 160) return res.status(400).json({ success: false, message: 'Search is too long' }); const regex = new RegExp(escapeRegex(search), 'i'); filter.$or = [{ title: regex }, { titleBn: regex }, { description: regex }, { category: regex }]; }
  if (req.query.year) { const year = Number(req.query.year); if (!Number.isInteger(year) || year < 1900 || year > 2200) return res.status(400).json({ success: false, message: 'Invalid year' }); filter.publishedAt = { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) }; }
  const [data, total] = await Promise.all([Document.find(filter).sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit), Document.countDocuments(filter)]);
  return res.json({ success: true, data: data.map(publicDocument), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const detail = wrap(async (req, res) => {
  const document = await Document.findOne({ slug: req.params.slug, accessLevel: 'public', status: 'published', relatedMember: null, relatedFinanceTransaction: null, category: { $nin: ['finance', 'member-document'] } });
  if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
  return res.json({ success: true, data: publicDocument(document) });
});

module.exports = { list, detail };
