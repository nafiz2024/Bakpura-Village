const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      name: { type: String, trim: true, maxlength: 120 },
      phone: { type: String, trim: true, maxlength: 30 },
      email: { type: String, trim: true, lowercase: true, maxlength: 254 },
      country: { type: String, trim: true, maxlength: 80 },
      isAnonymous: { type: Boolean, default: false },
    },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    currency: { type: String, required: true, uppercase: true, trim: true, default: 'BDT' },
    purpose: { type: String, required: true, trim: true, default: 'general' },
    paymentMethod: { type: String, required: true, trim: true },
    transactionReference: { type: String, trim: true, maxlength: 120 },
    note: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'verified', 'rejected', 'cancelled'], default: 'pending' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    verifiedAt: Date,
    rejectionReason: { type: String, trim: true, maxlength: 1000 },
    financeTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceTransaction', unique: true, sparse: true },
    source: { type: String, enum: ['website', 'admin', 'member', 'other'], default: 'website' },
  },
  { timestamps: true },
);

donationSchema.index({ status: 1, currency: 1, createdAt: -1 });
donationSchema.index({ purpose: 1, paymentMethod: 1 });

module.exports = mongoose.model('Donation', donationSchema);
