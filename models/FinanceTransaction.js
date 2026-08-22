const mongoose = require('mongoose');

const financeTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, immutable: true },
    type: { type: String, required: true, enum: ['income', 'expense'] },
    category: { type: String, required: true, trim: true },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    currency: { type: String, required: true, uppercase: true, trim: true, default: 'BDT' },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    paymentMethod: { type: String, required: true, trim: true },
    reference: { type: String, trim: true, maxlength: 120 },
    transactionDate: { type: Date, required: true, default: Date.now },
    relatedDonation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', unique: true, sparse: true },
    relatedMember: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    relatedActivity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'voided'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    approvedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    rejectedAt: Date,
    rejectionReason: { type: String, trim: true, maxlength: 1000 },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    voidedAt: Date,
    voidReason: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true },
);

financeTransactionSchema.index({ type: 1, category: 1, status: 1 });
financeTransactionSchema.index({ currency: 1, transactionDate: -1 });
financeTransactionSchema.index({ relatedMember: 1, transactionDate: -1 });
financeTransactionSchema.index({ relatedActivity: 1, transactionDate: -1 });

module.exports = mongoose.model('FinanceTransaction', financeTransactionSchema);
