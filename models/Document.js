const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  publicId: { type: String, trim: true },
  originalName: { type: String, required: true, trim: true },
  mimeType: { type: String, required: true, trim: true },
  extension: { type: String, required: true, lowercase: true, trim: true },
  size: { type: Number, required: true, min: 1 },
  checksum: { type: String, trim: true },
}, { _id: false });

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  titleBn: { type: String, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 3000 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  accessLevel: { type: String, enum: ['public', 'internal', 'restricted', 'highly-restricted'], default: 'internal' },
  status: { type: String, enum: ['draft', 'pending-approval', 'approved', 'published', 'unpublished', 'archived'], default: 'draft' },
  slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  file: { type: fileSchema, required: true },
  currentVersion: { type: Number, default: 1, min: 1 },
  relatedMember: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  relatedActivity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null },
  relatedCommittee: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', default: null },
  relatedFinanceTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceTransaction', default: null },
  publishedAt: Date,
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  rejectedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  rejectionReason: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  archivedAt: Date,
  downloadCount: { type: Number, default: 0, min: 0 },
  viewCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

documentSchema.index({ category: 1, accessLevel: 1, status: 1 });
documentSchema.index({ createdAt: -1, publishedAt: -1 });
documentSchema.index({ relatedMember: 1 });
documentSchema.index({ relatedActivity: 1 });

module.exports = mongoose.model('Document', documentSchema);
