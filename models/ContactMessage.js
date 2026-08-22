const mongoose = require('mongoose');

const internalNoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ['general', 'membership', 'donation', 'activity', 'complaint', 'suggestion', 'support', 'other'],
      default: 'general',
    },
    status: {
      type: String,
      enum: ['new', 'read', 'in-progress', 'resolved', 'closed', 'archived'],
      default: 'new',
    },
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    priorityRank: { type: Number, default: 0, select: false },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    internalNotes: { type: [internalNoteSchema], default: [] },
    readAt: Date,
    readBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    archivedAt: Date,
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    source: { type: String, enum: ['website'], default: 'website', immutable: true },
  },
  { timestamps: true },
);

contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ category: 1, priority: 1 });
contactMessageSchema.index({ assignedTo: 1, createdAt: -1 });

contactMessageSchema.pre('validate', function setPriorityRank() {
  this.priorityRank = { normal: 0, high: 1, urgent: 2 }[this.priority] ?? 0;
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
