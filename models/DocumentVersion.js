const mongoose = require('mongoose');

const versionFileSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  publicId: { type: String, trim: true },
  originalName: { type: String, required: true, trim: true },
  mimeType: { type: String, required: true, trim: true },
  extension: { type: String, required: true, lowercase: true, trim: true },
  size: { type: Number, required: true, min: 1 },
  checksum: { type: String, trim: true },
}, { _id: false });

const documentVersionSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  versionNumber: { type: Number, required: true, min: 1 },
  file: { type: versionFileSchema, required: true },
  changeNote: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  createdAt: { type: Date, default: Date.now },
});

documentVersionSchema.index({ document: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('DocumentVersion', documentVersionSchema);
