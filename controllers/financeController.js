const mongoose = require('mongoose');
const FinanceTransaction = require('../models/FinanceTransaction');
const Donation = require('../models/Donation');
const Member = require('../models/Member');
const Activity = require('../models/Activity');
const { validateTransaction, validateReason } = require('../validators/financeValidator');
const { nextTransactionId, serializeTransaction, formatCurrencyTotals } = require('../services/financeService');

const validId = (value) => mongoose.Types.ObjectId.isValid(value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wrap = (handler) => async (req, res, next) => { try { await handler(req, res); } catch (error) { if (error.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate Finance transaction reference' }); next(error); } };
const missing = (res) => res.status(404).json({ success: false, message: 'Finance transaction not found' });

const validateRelations = async (value) => {
  if (value.relatedMember && !await Member.exists({ _id: value.relatedMember })) return 'Related Member not found';
  if (value.relatedActivity && !await Activity.exists({ _id: value.relatedActivity })) return 'Related Activity not found';
  return null;
};

const create = wrap(async (req, res) => {
  const { errors, value } = validateTransaction(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  const relationError = await validateRelations(value);
  if (relationError) return res.status(400).json({ success: false, message: relationError });
  const transactionId = await nextTransactionId(value.transactionDate);
  const transaction = await FinanceTransaction.create({ ...value, transactionId, status: 'pending', createdBy: req.admin._id });
  return res.status(201).json({ success: true, data: serializeTransaction(transaction) });
});

const buildFilter = (query) => {
  const filter = {};
  const allowed = {
    type: ['income', 'expense'], status: ['pending', 'approved', 'rejected', 'voided'],
    currency: ['BDT', 'USD', 'GBP', 'EUR', 'SAR', 'AED'],
    paymentMethod: ['cash', 'bank', 'bkash', 'nagad', 'card', 'international-transfer', 'other'],
  };
  for (const [field, values] of Object.entries(allowed)) if (query[field]) {
    const value = field === 'currency' ? String(query[field]).toUpperCase() : query[field];
    if (!values.includes(value)) throw Object.assign(new Error(`Invalid ${field}`), { statusCode: 400 });
    filter[field] = value;
  }
  if (query.category) filter.category = String(query.category).trim();
  for (const [parameter, field] of [['member', 'relatedMember'], ['activity', 'relatedActivity']]) if (query[parameter]) {
    if (!validId(query[parameter])) throw Object.assign(new Error(`Invalid ${parameter}`), { statusCode: 400 });
    filter[field] = query[parameter];
  }
  if (query.search) {
    const search = String(query.search).trim();
    if (search.length > 120) throw Object.assign(new Error('Search is too long'), { statusCode: 400 });
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ transactionId: regex }, { description: regex }, { reference: regex }];
  }
  if (query.startDate || query.endDate) {
    filter.transactionDate = {};
    if (query.startDate) { const date = new Date(query.startDate); if (Number.isNaN(date.getTime())) throw Object.assign(new Error('Invalid startDate'), { statusCode: 400 }); filter.transactionDate.$gte = date; }
    if (query.endDate) { const date = new Date(query.endDate); if (Number.isNaN(date.getTime())) throw Object.assign(new Error('Invalid endDate'), { statusCode: 400 }); filter.transactionDate.$lte = date; }
  }
  return filter;
};

const list = wrap(async (req, res) => {
  const page = Number(req.query.page || 1), limit = Math.min(Number(req.query.limit || 20), 100);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) return res.status(400).json({ success: false, message: 'Invalid pagination' });
  let filter;
  try { filter = buildFilter(req.query); } catch (error) { return res.status(error.statusCode || 400).json({ success: false, message: error.message }); }
  const sorts = { newest: { transactionDate: -1, createdAt: -1 }, oldest: { transactionDate: 1, createdAt: 1 }, amount: { amount: -1 } }, sort = sorts[req.query.sort || 'newest'];
  if (!sort) return res.status(400).json({ success: false, message: 'Invalid sort' });
  const [data, total] = await Promise.all([
    FinanceTransaction.find(filter).populate('relatedMember', 'memberId fullName').populate('relatedActivity', 'title slug').sort(sort).skip((page - 1) * limit).limit(limit),
    FinanceTransaction.countDocuments(filter),
  ]);
  return res.json({ success: true, data: data.map(serializeTransaction), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const detail = wrap(async (req, res) => {
  const transaction = validId(req.params.id) && await FinanceTransaction.findById(req.params.id)
    .populate('relatedDonation').populate('relatedMember', 'memberId fullName contact.phone').populate('relatedActivity', 'title slug')
    .populate('approvedBy rejectedBy voidedBy createdBy updatedBy', 'fullName email username');
  if (!transaction) return missing(res);
  return res.json({ success: true, data: serializeTransaction(transaction) });
});

const update = wrap(async (req, res) => {
  const transaction = validId(req.params.id) && await FinanceTransaction.findById(req.params.id);
  if (!transaction) return missing(res);
  if (transaction.status !== 'pending') return res.status(409).json({ success: false, message: 'Only pending transactions can be edited' });
  const { errors, value } = validateTransaction({ ...req.body, type: req.body.type ?? transaction.type }, { partial: true });
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  const relationError = await validateRelations(value);
  if (relationError) return res.status(400).json({ success: false, message: relationError });
  Object.assign(transaction, value, { updatedBy: req.admin._id });
  await transaction.save();
  return res.json({ success: true, data: serializeTransaction(transaction) });
});

const approve = wrap(async (req, res) => {
  const transaction = validId(req.params.id) && await FinanceTransaction.findById(req.params.id);
  if (!transaction) return missing(res);
  if (transaction.status === 'approved') return res.status(200).json({ success: true, message: 'Transaction is already approved', data: serializeTransaction(transaction) });
  if (transaction.status !== 'pending') return res.status(409).json({ success: false, message: 'Only pending transactions can be approved' });
  transaction.status = 'approved'; transaction.approvedBy = req.admin._id; transaction.approvedAt = new Date();
  await transaction.save();
  return res.json({ success: true, data: serializeTransaction(transaction) });
});

const reject = wrap(async (req, res) => {
  const { errors, value } = validateReason(req.body, 'rejectionReason');
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  const transaction = validId(req.params.id) && await FinanceTransaction.findById(req.params.id);
  if (!transaction) return missing(res);
  if (transaction.status !== 'pending') return res.status(409).json({ success: false, message: 'Only pending transactions can be rejected' });
  transaction.status = 'rejected'; transaction.rejectionReason = value; transaction.rejectedBy = req.admin._id; transaction.rejectedAt = new Date();
  await transaction.save();
  return res.json({ success: true, data: serializeTransaction(transaction) });
});

const voidTransaction = wrap(async (req, res) => {
  const { errors, value } = validateReason(req.body, 'voidReason');
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  const transaction = validId(req.params.id) && await FinanceTransaction.findById(req.params.id);
  if (!transaction) return missing(res);
  if (transaction.status !== 'approved') return res.status(409).json({ success: false, message: 'Only approved transactions can be voided' });
  transaction.status = 'voided'; transaction.voidReason = value; transaction.voidedBy = req.admin._id; transaction.voidedAt = new Date();
  await transaction.save();
  return res.json({ success: true, data: serializeTransaction(transaction) });
});

const summary = wrap(async (req, res) => {
  const rows = await FinanceTransaction.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$currency', income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', { $toDecimal: '0' }] } }, expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', { $toDecimal: '0' }] } } } },
    { $set: { balance: { $subtract: ['$income', '$expense'] } } },
    { $sort: { _id: 1 } },
  ]);
  return res.json({ success: true, data: formatCurrencyTotals(rows) });
});

const stats = wrap(async (req, res) => {
  const [pendingTransactions, pendingDonations, approvedIncomeCount, approvedExpenseCount, recentTransactions] = await Promise.all([
    FinanceTransaction.countDocuments({ status: 'pending' }), Donation.countDocuments({ status: 'pending' }),
    FinanceTransaction.countDocuments({ status: 'approved', type: 'income' }), FinanceTransaction.countDocuments({ status: 'approved', type: 'expense' }),
    FinanceTransaction.find().sort({ transactionDate: -1, createdAt: -1 }).limit(5),
  ]);
  return res.json({ success: true, data: { pendingTransactions, pendingDonations, approvedIncomeCount, approvedExpenseCount, recentTransactions: recentTransactions.map(serializeTransaction) } });
});

const report = wrap(async (req, res) => {
  let filter;
  try { filter = buildFilter(req.query); } catch (error) { return res.status(error.statusCode || 400).json({ success: false, message: error.message }); }
  const transactions = await FinanceTransaction.find(filter).sort({ transactionDate: 1, createdAt: 1 });
  return res.json({ success: true, filters: { startDate: req.query.startDate, endDate: req.query.endDate, currency: req.query.currency, type: req.query.type, category: req.query.category }, count: transactions.length, data: transactions.map(serializeTransaction) });
});

const exportData = wrap(async (req, res) => {
  let filter;
  try { filter = buildFilter(req.query); } catch (error) { return res.status(error.statusCode || 400).json({ success: false, message: error.message }); }
  const transactions = await FinanceTransaction.find(filter).sort({ transactionDate: 1, createdAt: 1 });
  return res.json({ success: true, format: 'json', count: transactions.length, data: transactions.map(serializeTransaction) });
});

module.exports = { create, list, detail, update, approve, reject, voidTransaction, summary, stats, report, exportData };
