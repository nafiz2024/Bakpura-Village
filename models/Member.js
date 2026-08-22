const mongoose = require('mongoose');

const profilePhotoSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
  },
  { _id: false },
);

const contactSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    village: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { _id: false },
);

const membershipSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['general', 'expatriate', 'youth', 'honorary'],
      default: 'general',
    },
    joinedAt: { type: Date, default: Date.now },
    reasonForJoining: { type: String, trim: true },
  },
  { _id: false },
);

const professionalSchema = new mongoose.Schema(
  {
    occupation: { type: String, trim: true },
    organization: { type: String, trim: true },
  },
  { _id: false },
);

const expatriateSchema = new mongoose.Schema(
  {
    isExpatriate: { type: Boolean, default: false },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    profession: { type: String, trim: true },
  },
  { _id: false },
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false },
);

const identityVerificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['nid', 'passport', 'birth-certificate', 'other'],
    },
    number: { type: String, trim: true, select: false },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { _id: false },
);

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
    profilePhoto: profilePhotoSchema,
    contact: { type: contactSchema, required: true },
    membership: { type: membershipSchema, default: () => ({}) },
    professional: professionalSchema,
    expatriate: { type: expatriateSchema, default: () => ({}) },
    emergencyContact: emergencyContactSchema,
    identityVerification: identityVerificationSchema,
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    archivedAt: Date,
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

memberSchema.index({ status: 1 });
memberSchema.index({ 'membership.type': 1 });
memberSchema.index({ 'contact.country': 1 });
memberSchema.index({ createdAt: -1 });
memberSchema.index(
  { 'contact.phone': 1 },
  { unique: true, partialFilterExpression: { 'contact.phone': { $type: 'string' } } },
);
memberSchema.index(
  { 'contact.email': 1 },
  { unique: true, partialFilterExpression: { 'contact.email': { $type: 'string' } } },
);

module.exports = mongoose.model('Member', memberSchema);
