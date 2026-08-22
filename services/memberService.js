const Counter = require('../models/Counter');
const Member = require('../models/Member');

const generateMemberId = async (year = new Date().getFullYear(), session = null) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: `member:${year}` },
    { $inc: { sequence: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, session },
  );
  return `BPK-${year}-${String(counter.sequence).padStart(4, '0')}`;
};

const createMember = async (data, adminId, { session = null } = {}) => {
  const memberId = await generateMemberId(new Date().getFullYear(), session);
  const [member] = await Member.create([{ ...data, memberId, createdBy: adminId }], { session });
  return member;
};

const maskIdentityNumber = (number) => {
  if (!number) return undefined;
  const visible = number.slice(-4);
  return `${'*'.repeat(Math.max(number.length - visible.length, 4))}${visible}`;
};

const serializeMemberListItem = (member) => ({
  id: member._id.toString(),
  memberId: member.memberId,
  fullName: member.fullName,
  profilePhoto: member.profilePhoto || null,
  membership: {
    type: member.membership?.type,
    joinedAt: member.membership?.joinedAt,
  },
  contact: {
    phone: member.contact?.phone,
    country: member.contact?.country,
  },
  status: member.status,
  createdAt: member.createdAt,
});

const serializeMemberDetail = (member) => {
  const source = member.toObject ? member.toObject() : member;
  return {
    id: source._id.toString(),
    memberId: source.memberId,
    fullName: source.fullName,
    fatherName: source.fatherName,
    motherName: source.motherName,
    dateOfBirth: source.dateOfBirth,
    gender: source.gender,
    profilePhoto: source.profilePhoto || null,
    contact: source.contact,
    membership: source.membership,
    professional: source.professional,
    expatriate: source.expatriate,
    emergencyContact: source.emergencyContact,
    identityVerification: source.identityVerification
      ? {
          type: source.identityVerification.type,
          number: maskIdentityNumber(source.identityVerification.number),
          verified: source.identityVerification.verified,
          verifiedAt: source.identityVerification.verifiedAt,
        }
      : undefined,
    status: source.status,
    archivedAt: source.archivedAt,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};

module.exports = {
  createMember,
  generateMemberId,
  serializeMemberListItem,
  serializeMemberDetail,
};
