const mongoose = require('mongoose');

const imageReference = new mongoose.Schema({ url: { type: String, trim: true }, publicId: { type: String, trim: true } }, { _id: false });
const stat = new mongoose.Schema({ label: { type: String, trim: true }, value: { type: String, trim: true, default: '' }, isVisible: { type: Boolean, default: false } }, { _id: false });
const paymentDisplay = new mongoose.Schema({
  type: { type: String, required: true, enum: ['bkash', 'nagad', 'bank', 'international-transfer', 'other'] },
  label: { type: String, required: true, trim: true }, accountName: { type: String, trim: true }, accountNumber: { type: String, trim: true },
  instructions: { type: String, trim: true }, isEnabled: { type: Boolean, default: false }, displayOrder: { type: Number, default: 100, min: 0 },
}, { _id: true });

const websiteSettingsSchema = new mongoose.Schema({
  siteKey: { type: String, required: true, unique: true, immutable: true, default: 'bakpura-main' },
  general: {
    siteName: { type: String, trim: true, default: '' }, siteNameBn: { type: String, trim: true, default: '' }, tagline: { type: String, trim: true, default: '' }, taglineBn: { type: String, trim: true, default: '' },
    defaultLanguage: { type: String, enum: ['bn', 'en'], default: 'bn' }, timezone: { type: String, default: 'Asia/Dhaka' }, dateFormat: { type: String, default: 'DD/MM/YYYY' }, currency: { type: String, default: 'BDT' },
  },
  organization: {
    name: { type: String, trim: true, default: '' }, nameBn: { type: String, trim: true, default: '' }, slogan: { type: String, trim: true, default: '' }, sloganBn: { type: String, trim: true, default: '' },
    shortDescription: { type: String, trim: true, default: '' }, aboutSummary: { type: String, trim: true, default: '' }, establishedYear: { type: Number, default: null }, registrationInfo: { type: String, trim: true, default: '' },
  },
  branding: {
    logo: { type: imageReference, default: () => ({}) }, banner: { type: imageReference, default: () => ({}) }, favicon: { type: imageReference, default: () => ({}) },
    primaryColor: { type: String, default: '#062B5C' }, secondaryColor: { type: String, default: '#0A4B8E' }, accentColor: { type: String, default: '#168447' },
  },
  contact: {
    phone: { type: String, trim: true, default: '' }, secondaryPhone: { type: String, trim: true, default: '' }, email: { type: String, trim: true, lowercase: true, default: '' }, secondaryEmail: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' }, village: { type: String, trim: true, default: '' }, upazila: { type: String, trim: true, default: '' }, district: { type: String, trim: true, default: '' }, country: { type: String, trim: true, default: '' }, officeHours: { type: String, trim: true, default: '' },
  },
  social: { facebook: { type: String, default: '' }, youtube: { type: String, default: '' }, instagram: { type: String, default: '' }, whatsapp: { type: String, default: '' }, linkedin: { type: String, default: '' } },
  membership: {
    applicationsEnabled: { type: Boolean, default: true }, allowedTypes: { type: [String], enum: ['general', 'expatriate', 'youth', 'honorary'], default: ['general', 'expatriate', 'youth', 'honorary'] },
    requirePhone: { type: Boolean, default: true }, requireEmail: { type: Boolean, default: false }, requireProfilePhoto: { type: Boolean, default: false }, requireIdentityVerification: { type: Boolean, default: false },
    memberIdPrefix: { type: String, default: 'BPK' }, applicationMessage: { type: String, trim: true, default: '' },
  },
  donation: {
    enabled: { type: Boolean, default: true }, allowAnonymous: { type: Boolean, default: true }, defaultCurrency: { type: String, default: 'BDT' },
    supportedCurrencies: { type: [String], default: ['BDT'] }, minimumAmount: { type: String, default: '1.00' }, publicMessage: { type: String, trim: true, default: '' },
    paymentMethods: { type: [paymentDisplay], default: [] }, showPublicDonorNames: { type: Boolean, default: false }, showPublicAmounts: { type: Boolean, default: false },
  },
  news: { itemsPerPage: { type: Number, default: 10 }, showFeatured: { type: Boolean, default: true }, showImportantNoticeBar: { type: Boolean, default: true }, showPinned: { type: Boolean, default: true } },
  activities: { itemsPerPage: { type: Number, default: 10 }, showFeatured: { type: Boolean, default: true }, showImpactMetrics: { type: Boolean, default: true } },
  gallery: { itemsPerPage: { type: Number, default: 12 }, showVideos: { type: Boolean, default: true }, showFeatured: { type: Boolean, default: true }, requireConsentConfirmation: { type: Boolean, default: true } },
  homepage: {
    showHero: { type: Boolean, default: true }, showImpactStats: { type: Boolean, default: true }, showAboutPreview: { type: Boolean, default: true }, showActivities: { type: Boolean, default: true }, showNews: { type: Boolean, default: true }, showGallery: { type: Boolean, default: true }, showMembershipCTA: { type: Boolean, default: true }, showDonationCTA: { type: Boolean, default: true },
    sectionOrder: { type: [String], default: ['hero', 'about', 'stats', 'activities', 'news', 'gallery', 'membership', 'donation'] },
    stats: { members: { type: stat, default: () => ({}) }, activities: { type: stat, default: () => ({}) }, beneficiaries: { type: stat, default: () => ({}) }, volunteers: { type: stat, default: () => ({}) } },
  },
  announcement: { enabled: { type: Boolean, default: false }, message: { type: String, trim: true, default: '' }, link: { type: String, default: '' }, type: { type: String, enum: ['info', 'success', 'warning', 'important'], default: 'info' } },
  maintenance: { enabled: { type: Boolean, default: false }, message: { type: String, trim: true, default: '' } },
  legal: { privacyPolicyEnabled: { type: Boolean, default: false }, privacyContactEmail: { type: String, trim: true, lowercase: true, default: '' } },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  version: { type: Number, default: 1, min: 1 },
}, { timestamps: true, minimize: false });

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema);
