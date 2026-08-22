const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true }, motherName: { type: String, trim: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
    contact: {
      phone: { type: String, required: true, trim: true }, email: { type: String, lowercase: true, trim: true },
      country: { type: String, trim: true }, city: { type: String, trim: true }, village: { type: String, trim: true }, address: { type: String, trim: true },
    },
    membership: {
      type: { type: String, enum: ['general', 'expatriate', 'youth', 'honorary'], default: 'general' },
      reasonForJoining: { type: String, trim: true },
    },
    professional: { occupation: { type: String, trim: true }, organization: { type: String, trim: true } },
    expatriate: {
      isExpatriate: { type: Boolean, default: false }, country: { type: String, trim: true },
      city: { type: String, trim: true }, profession: { type: String, trim: true },
    },
    status: { type: String, enum: ['pending', 'under-review', 'more-info-required', 'approved', 'rejected', 'archived'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, reviewedAt: Date,
    reviewNotes: { type: String, trim: true }, rejectionReason: { type: String, trim: true },
    assignedReviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedMember: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' }, approvedAt: Date,
  }, { timestamps: true },
);

applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ 'membership.type': 1 });
applicationSchema.index({ 'contact.country': 1 });
module.exports = mongoose.model('MembershipApplication', applicationSchema);
