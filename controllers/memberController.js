const mongoose = require('mongoose');
const Member = require('../models/Member');
const { validateMemberPayload } = require('../validators/memberValidator');
const {
  createMember: createMemberRecord,
  serializeMemberListItem,
  serializeMemberDetail,
} = require('../services/memberService');

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    if (error?.code === 11000) {
      res.status(409);
      error.message = 'A member with that phone or email already exists';
    } else if (error?.name === 'ValidationError' || error?.name === 'CastError') {
      res.status(400);
      error.message = 'Invalid member data';
    }
    next(error);
  }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getMember = async (id, { includeIdentityNumber = false } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  let query = Member.findById(id);
  if (includeIdentityNumber) query = query.select('+identityVerification.number');
  return query;
};

const applyValidatedUpdates = (member, updates) => {
  for (const [key, value] of Object.entries(updates)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        member.set(`${key}.${nestedKey}`, nestedValue);
      }
    } else {
      member.set(key, value);
    }
  }
};

const createMember = asyncHandler(async (req, res) => {
  const { errors, value } = validateMemberPayload(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });

  const duplicateConditions = [{ 'contact.phone': value.contact.phone }];
  if (value.contact.email) duplicateConditions.push({ 'contact.email': value.contact.email });
  const duplicate = await Member.findOne({ $or: duplicateConditions }).select('_id').lean();
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'A member with that phone or email already exists' });
  }

  if (value.identityVerification?.verified) {
    value.identityVerification.verifiedAt = new Date();
    value.identityVerification.verifiedBy = req.admin._id;
  }

  const member = await createMemberRecord(value, req.admin._id);
  return res.status(201).json({ success: true, data: serializeMemberDetail(member) });
});

const listMembers = asyncHandler(async (req, res) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ success: false, message: 'Invalid pagination values' });
  }

  const filter = {};
  if (req.query.status !== undefined) {
    if (!['active', 'inactive', 'archived'].includes(req.query.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status filter' });
    }
    filter.status = req.query.status;
  }
  if (req.query.membershipType !== undefined) {
    if (!['general', 'expatriate', 'youth', 'honorary'].includes(req.query.membershipType)) {
      return res.status(400).json({ success: false, message: 'Invalid membershipType filter' });
    }
    filter['membership.type'] = req.query.membershipType;
  }
  if (req.query.country !== undefined) {
    const country = String(req.query.country).trim();
    if (!country) return res.status(400).json({ success: false, message: 'Invalid country filter' });
    filter['contact.country'] = new RegExp(`^${escapeRegex(country)}$`, 'i');
  }
  if (req.query.isExpatriate !== undefined) {
    if (!['true', 'false'].includes(req.query.isExpatriate)) {
      return res.status(400).json({ success: false, message: 'isExpatriate must be true or false' });
    }
    filter['expatriate.isExpatriate'] = req.query.isExpatriate === 'true';
  }
  if (req.query.year !== undefined) {
    const year = Number(req.query.year);
    if (!Number.isInteger(year) || year < 1900 || year > 9999) {
      return res.status(400).json({ success: false, message: 'Invalid year filter' });
    }
    filter['membership.joinedAt'] = {
      $gte: new Date(Date.UTC(year, 0, 1)),
      $lt: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }
  if (req.query.search !== undefined) {
    const search = String(req.query.search).trim();
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { memberId: pattern },
        { fullName: pattern },
        { 'contact.phone': pattern },
        { 'contact.email': pattern },
        { 'contact.country': pattern },
      ];
    }
  }

  const sorts = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'name-asc': { fullName: 1 },
    'name-desc': { fullName: -1 },
    'member-id': { memberId: 1 },
  };
  const sortName = req.query.sort || 'newest';
  if (!sorts[sortName]) return res.status(400).json({ success: false, message: 'Invalid sort option' });

  const [members, total] = await Promise.all([
    Member.find(filter)
      .select('memberId fullName profilePhoto membership.type membership.joinedAt contact.phone contact.country status createdAt')
      .sort(sorts[sortName])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Member.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: members.map(serializeMemberListItem),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

const getMemberDetails = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid member ID' });
  }
  const member = await getMember(req.params.id, { includeIdentityNumber: true });
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  return res.status(200).json({ success: true, data: serializeMemberDetail(member) });
});

const updateMember = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid member ID' });
  }
  const { errors, value } = validateMemberPayload(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  if (!Object.keys(value).length) {
    return res.status(400).json({ success: false, message: 'No editable member fields supplied' });
  }

  const member = await getMember(req.params.id, { includeIdentityNumber: true });
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  applyValidatedUpdates(member, value);
  if (value.identityVerification?.verified !== undefined) {
    member.identityVerification.verifiedAt = value.identityVerification.verified ? new Date() : undefined;
    member.identityVerification.verifiedBy = value.identityVerification.verified ? req.admin._id : undefined;
  }
  member.updatedBy = req.admin._id;
  await member.save();
  return res.status(200).json({ success: true, data: serializeMemberDetail(member) });
});

const updateMemberStatus = asyncHandler(async (req, res) => {
  if (!['active', 'inactive'].includes(req.body.status)) {
    return res.status(400).json({ success: false, message: 'Status must be active or inactive' });
  }
  const member = await getMember(req.params.id, { includeIdentityNumber: true });
  if (!member) {
    const status = mongoose.Types.ObjectId.isValid(req.params.id) ? 404 : 400;
    return res.status(status).json({ success: false, message: status === 404 ? 'Member not found' : 'Invalid member ID' });
  }
  if (member.status === 'archived') {
    return res.status(409).json({ success: false, message: 'Restore the member before changing status' });
  }
  member.status = req.body.status;
  member.updatedBy = req.admin._id;
  await member.save();
  return res.status(200).json({ success: true, data: serializeMemberDetail(member) });
});

const archiveMember = asyncHandler(async (req, res) => {
  const member = await getMember(req.params.id, { includeIdentityNumber: true });
  if (!member) {
    const status = mongoose.Types.ObjectId.isValid(req.params.id) ? 404 : 400;
    return res.status(status).json({ success: false, message: status === 404 ? 'Member not found' : 'Invalid member ID' });
  }
  if (member.status === 'archived') {
    return res.status(200).json({ success: true, message: 'Member is already archived', data: serializeMemberDetail(member) });
  }
  member.status = 'archived';
  member.archivedAt = new Date();
  member.archivedBy = req.admin._id;
  member.updatedBy = req.admin._id;
  await member.save();
  return res.status(200).json({ success: true, message: 'Member archived', data: serializeMemberDetail(member) });
});

const restoreMember = asyncHandler(async (req, res) => {
  const member = await getMember(req.params.id, { includeIdentityNumber: true });
  if (!member) {
    const status = mongoose.Types.ObjectId.isValid(req.params.id) ? 404 : 400;
    return res.status(status).json({ success: false, message: status === 404 ? 'Member not found' : 'Invalid member ID' });
  }
  if (member.status !== 'archived') {
    return res.status(409).json({ success: false, message: 'Member is not archived' });
  }
  member.status = 'active';
  member.archivedAt = undefined;
  member.archivedBy = undefined;
  member.updatedBy = req.admin._id;
  await member.save();
  return res.status(200).json({ success: true, message: 'Member restored', data: serializeMemberDetail(member) });
});

const getMemberStats = asyncHandler(async (req, res) => {
  const [total, active, inactive, archived, expatriate] = await Promise.all([
    Member.countDocuments(),
    Member.countDocuments({ status: 'active' }),
    Member.countDocuments({ status: 'inactive' }),
    Member.countDocuments({ status: 'archived' }),
    Member.countDocuments({ 'expatriate.isExpatriate': true }),
  ]);
  return res.status(200).json({
    success: true,
    data: { total, active, inactive, archived, expatriate },
  });
});

module.exports = {
  createMember,
  listMembers,
  getMemberDetails,
  updateMember,
  updateMemberStatus,
  archiveMember,
  restoreMember,
  getMemberStats,
};
