const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const FinanceTransaction = require('../models/FinanceTransaction');
const { validateReason } = require('../validators/financeValidator');
const { nextTransactionId, serializeDonation } = require('../services/financeService');

const validId = (value) => mongoose.Types.ObjectId.isValid(value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wrap = (handler) => async (req, res, next) => { try { await handler(req, res); } catch (error) { next(error); } };
const missing = (res) => res.status(404).json({ success: false, message: 'Donation not found' });

const list = wrap(async (req, res) => {
  const page = Number(req.query.page || 1), limit = Math.min(Number(req.query.limit || 20), 100);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) return res.status(400).json({ success: false, message: 'Invalid pagination' });
  const filter = {};
  const enums = { status: ['pending', 'verified', 'rejected', 'cancelled'], currency: ['BDT', 'USD', 'GBP', 'EUR', 'SAR', 'AED'], purpose: ['general', 'education', 'medical', 'relief', 'community-development', 'activity', 'other'], paymentMethod: ['cash', 'bank', 'bkash', 'nagad', 'card', 'international-transfer', 'other'] };
  for (const [field, allowed] of Object.entries(enums)) if (req.query[field]) {
    const value = field === 'currency' ? req.query[field].toUpperCase() : req.query[field];
    if (!allowed.includes(value)) return res.status(400).json({ success: false, message: `Invalid ${field}` });
    filter[field] = value;
  }
  if (req.query.anonymous !== undefined) {
    if (!['true', 'false'].includes(req.query.anonymous)) return res.status(400).json({ success: false, message: 'Invalid anonymous filter' });
    filter['donor.isAnonymous'] = req.query.anonymous === 'true';
  }
  if (req.query.search) {
    const search = String(req.query.search).trim();
    if (search.length > 120) return res.status(400).json({ success: false, message: 'Search is too long' });
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ 'donor.name': regex }, { 'donor.phone': regex }, { 'donor.email': regex }, { transactionReference: regex }];
  }
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) { const date = new Date(req.query.startDate); if (Number.isNaN(date.getTime())) return res.status(400).json({ success: false, message: 'Invalid startDate' }); filter.createdAt.$gte = date; }
    if (req.query.endDate) { const date = new Date(req.query.endDate); if (Number.isNaN(date.getTime())) return res.status(400).json({ success: false, message: 'Invalid endDate' }); filter.createdAt.$lte = date; }
  }
  const sorts = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, amount: { amount: -1 } }, sort = sorts[req.query.sort || 'newest'];
  if (!sort) return res.status(400).json({ success: false, message: 'Invalid sort' });
  const [data, total] = await Promise.all([Donation.find(filter).sort(sort).skip((page - 1) * limit).limit(limit), Donation.countDocuments(filter)]);
  return res.json({ success: true, data: data.map(serializeDonation), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const stats = wrap(async (req, res) => {
  const [total, pending, verified, rejected, anonymous, amounts] = await Promise.all([
    Donation.countDocuments(), Donation.countDocuments({ status: 'pending' }), Donation.countDocuments({ status: 'verified' }),
    Donation.countDocuments({ status: 'rejected' }), Donation.countDocuments({ 'donor.isAnonymous': true }),
    Donation.aggregate([{ $group: { _id: { currency: '$currency', status: '$status' }, amount: { $sum: '$amount' } } }]),
  ]);
  const grouped = {};
  for (const row of amounts) {
    grouped[row._id.currency] ||= {};
    grouped[row._id.currency][row._id.status] = row.amount.toString();
  }
  return res.json({ success: true, data: { total, pending, verified, rejected, anonymous, amountsByCurrency: grouped } });
});

const detail = wrap(async (req, res) => {
  const donation = validId(req.params.id) && await Donation.findById(req.params.id).populate('verifiedBy financeTransaction', 'fullName email username transactionId status');
  if (!donation) return missing(res);
  return res.json({ success: true, data: serializeDonation(donation) });
});

const verify = wrap(async (req, res) => {
  if (!validId(req.params.id)) return missing(res);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const donation = await Donation.findById(req.params.id).session(session);
      if (!donation) throw Object.assign(new Error('Donation not found'), { statusCode: 404 });
      if (donation.status === 'verified') { result = { donation, existing: true }; return; }
      if (donation.status !== 'pending') throw Object.assign(new Error('Only pending donations can be verified'), { statusCode: 409 });
      const transactionId = await nextTransactionId(new Date(), session);
      const [transaction] = await FinanceTransaction.create([{
        transactionId, type: 'income', category: 'donation', amount: donation.amount,
        currency: donation.currency, description: `Verified donation ${donation._id}`,
        paymentMethod: donation.paymentMethod, reference: donation.transactionReference,
        transactionDate: new Date(), relatedDonation: donation._id, status: 'approved',
        approvedBy: req.admin._id, approvedAt: new Date(), createdBy: req.admin._id,
      }], { session });
      donation.status = 'verified'; donation.verifiedBy = req.admin._id; donation.verifiedAt = new Date(); donation.financeTransaction = transaction._id;
      await donation.save({ session });
      result = { donation, transaction, existing: false };
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Donation already has a Finance transaction' });
    throw error;
  } finally { await session.endSession(); }
  if (result.existing) return res.status(200).json({ success: true, message: 'Donation is already verified', data: serializeDonation(result.donation) });
  return res.json({ success: true, message: 'Donation verified and ledger transaction approved', data: serializeDonation(result.donation), transactionId: result.transaction.transactionId });
});

const reject = wrap(async (req, res) => {
  const { errors, value } = validateReason(req.body, 'rejectionReason');
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  const donation = validId(req.params.id) && await Donation.findById(req.params.id);
  if (!donation) return missing(res);
  if (donation.status !== 'pending') return res.status(409).json({ success: false, message: 'Only pending donations can be rejected' });
  donation.status = 'rejected'; donation.rejectionReason = value;
  await donation.save();
  return res.json({ success: true, data: serializeDonation(donation) });
});

module.exports = { list, stats, detail, verify, reject };
