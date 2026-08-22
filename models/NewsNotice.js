const mongoose = require('mongoose');
const image = { url: String, publicId: String, alt: String };
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, titleBn: { type: String, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  type: { type: String, required: true, enum: ['news','notice','announcement','event','activity-update'] },
  category: { type: String, trim: true }, summary: { type: String, trim: true }, content: { type: String, trim: true },
  status: { type: String, enum: ['draft','published','unpublished','archived'], default: 'draft' },
  isPinned: { type: Boolean, default: false }, isFeatured: { type: Boolean, default: false }, isImportant: { type: Boolean, default: false },
  publishDate: Date, eventDate: Date, expiryDate: Date, featuredImage: image,
  gallery: [{ ...image, caption: String, displayOrder: { type: Number, default: 0, min: 0 } }],
  attachments: [{ title: String, url: String, publicId: String, fileType: String, isPublic: { type: Boolean, default: false } }],
  relatedActivity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  publicContact: { name: String, phone: String, email: String },
  publishedAt: Date, publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  seo: { metaTitle: String, metaDescription: String },
}, { timestamps: true });
schema.index({ status: 1, type: 1, category: 1 }); schema.index({ isPinned: 1, isFeatured: 1, isImportant: 1 }); schema.index({ publishedAt: -1, createdAt: -1 });
module.exports = mongoose.model('NewsNotice', schema);
