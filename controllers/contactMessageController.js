const mongoose = require('mongoose');
const ContactMessage = require('../models/ContactMessage');
const Admin = require('../models/Admin');
const { validateNote } = require('../validators/contactValidator');

const STATUSES = ['new', 'read', 'in-progress', 'resolved', 'closed'];
const ALL_STATUSES = [...STATUSES, 'archived'];
const CATEGORIES = ['general', 'membership', 'donation', 'activity', 'complaint', 'suggestion', 'support', 'other'];
const PRIORITIES = ['normal', 'high', 'urgent'];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const validId = (value) => mongoose.Types.ObjectId.isValid(value);

const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid contact message data' });
    }
    return next(error);
  }
};

const findMessage = async (id) => (validId(id) ? ContactMessage.findById(id) : null);
const notFound = (res) => res.status(404).json({ success: false, message: 'Contact message not found' });

const list = wrap(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
    return res.status(400).json({ success: false, message: 'Invalid pagination' });
  }

  const filter = {};
  if (req.query.status) {
    if (!ALL_STATUSES.includes(req.query.status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    filter.status = req.query.status;
  }
  if (req.query.category) {
    if (!CATEGORIES.includes(req.query.category)) return res.status(400).json({ success: false, message: 'Invalid category' });
    filter.category = req.query.category;
  }
  if (req.query.priority) {
    if (!PRIORITIES.includes(req.query.priority)) return res.status(400).json({ success: false, message: 'Invalid priority' });
    filter.priority = req.query.priority;
  }
  if (req.query.assignedTo) {
    if (!validId(req.query.assignedTo)) return res.status(400).json({ success: false, message: 'Invalid assignedTo' });
    filter.assignedTo = req.query.assignedTo;
  }
  if (req.query.search) {
    const search = String(req.query.search).trim();
    if (search.length > 120) return res.status(400).json({ success: false, message: 'Search is too long' });
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { subject: regex }];
  }

  const sorts = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priority: { priorityRank: -1, createdAt: -1 },
  };
  const sort = sorts[req.query.sort || 'newest'];
  if (!sort) return res.status(400).json({ success: false, message: 'Invalid sort' });

  const [messages, total] = await Promise.all([
    ContactMessage.find(filter)
      .select('-internalNotes')
      .populate('assignedTo', 'fullName email username status')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    ContactMessage.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: messages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

const stats = wrap(async (req, res) => {
  const queries = {
    total: {}, new: { status: 'new' }, read: { status: 'read' },
    inProgress: { status: 'in-progress' }, resolved: { status: 'resolved' },
    closed: { status: 'closed' }, archived: { status: 'archived' },
    highPriority: { priority: 'high' }, urgent: { priority: 'urgent' },
  };
  const counts = await Promise.all(Object.values(queries).map((query) => ContactMessage.countDocuments(query)));
  return res.json({ success: true, data: Object.fromEntries(Object.keys(queries).map((key, index) => [key, counts[index]])) });
});

const detail = wrap(async (req, res) => {
  const message = await (validId(req.params.id)
    ? ContactMessage.findById(req.params.id)
      .populate('assignedTo readBy resolvedBy archivedBy', 'fullName email username status')
      .populate('internalNotes.createdBy', 'fullName email username status')
    : null);
  if (!message) return notFound(res);
  return res.json({ success: true, data: message });
});

const markRead = wrap(async (req, res) => {
  const message = await findMessage(req.params.id);
  if (!message) return notFound(res);
  if (!['resolved', 'closed', 'archived'].includes(message.status)) message.status = 'read';
  if (!message.readAt) {
    message.readAt = new Date();
    message.readBy = req.admin._id;
  }
  await message.save();
  return res.json({ success: true, data: message });
});

const updateStatus = wrap(async (req, res) => {
  if (typeof req.body.status !== 'string' || !STATUSES.includes(req.body.status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  const message = await findMessage(req.params.id);
  if (!message) return notFound(res);
  message.status = req.body.status;
  if (req.body.status === 'resolved') {
    message.resolvedAt = new Date();
    message.resolvedBy = req.admin._id;
  } else {
    message.resolvedAt = undefined;
    message.resolvedBy = null;
  }
  await message.save();
  return res.json({ success: true, data: message });
});

const updatePriority = wrap(async (req, res) => {
  if (typeof req.body.priority !== 'string' || !PRIORITIES.includes(req.body.priority)) {
    return res.status(400).json({ success: false, message: 'Invalid priority' });
  }
  const message = await findMessage(req.params.id);
  if (!message) return notFound(res);
  message.priority = req.body.priority;
  await message.save();
  return res.json({ success: true, data: message });
});

const assign = wrap(async (req, res) => {
  if (!validId(req.body.assignedTo)) return res.status(400).json({ success: false, message: 'Invalid assignedTo' });
  const [message, admin] = await Promise.all([
    findMessage(req.params.id),
    Admin.findOne({ _id: req.body.assignedTo, status: 'active' }),
  ]);
  if (!message) return notFound(res);
  if (!admin) return res.status(400).json({ success: false, message: 'Active Admin not found' });
  message.assignedTo = admin._id;
  await message.save();
  return res.json({ success: true, data: message });
});

const addNote = wrap(async (req, res) => {
  const { errors, value } = validateNote(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  const message = await findMessage(req.params.id);
  if (!message) return notFound(res);
  message.internalNotes.push({ note: value.note, createdBy: req.admin._id });
  await message.save();
  return res.status(201).json({ success: true, data: message.internalNotes.at(-1) });
});

const archive = wrap(async (req, res) => {
  const message = await findMessage(req.params.id);
  if (!message) return notFound(res);
  message.status = 'archived';
  message.archivedAt = new Date();
  message.archivedBy = req.admin._id;
  await message.save();
  return res.json({ success: true, data: message });
});

const restore = wrap(async (req, res) => {
  const message = await findMessage(req.params.id);
  if (!message) return notFound(res);
  if (message.status !== 'archived') return res.status(400).json({ success: false, message: 'Contact message is not archived' });
  message.status = 'read';
  message.archivedAt = undefined;
  message.archivedBy = null;
  await message.save();
  return res.json({ success: true, data: message });
});

module.exports = { list, stats, detail, markRead, updateStatus, updatePriority, assign, addNote, archive, restore };
