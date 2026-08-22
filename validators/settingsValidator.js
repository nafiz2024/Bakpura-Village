const { normalizeAmount } = require('../utils/money');
const { CURRENCIES } = require('./donationValidator');
const { ALL_SECTIONS } = require('../services/settingsAccessService');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const colorPattern = /^#[0-9A-Fa-f]{6}$/;
const prefixPattern = /^[A-Z0-9]{2,10}$/;
const htmlPattern = /<\/?[a-z][^>]*>/i;
const secretKeyPattern = /(?:password|secret|token|private.?key|api.?key|merchant.?secret|jwt|mongodb|smtp|cloudinary|aws)/i;

const hasSecretKey = (value) => value && typeof value === 'object' && Object.entries(value).some(([key, child]) => secretKeyPattern.test(key) || hasSecretKey(child));
const rejectUnknown = (body, allowed, errors, prefix = '') => Object.keys(body).filter((key) => !allowed.includes(key)).forEach((key) => errors.push(`${prefix}${key} is not allowed`));
const plain = (value, field, max, errors) => {
  if (typeof value !== 'string') { errors.push(`${field} must be a string`); return undefined; }
  const result = value.trim(); if (result.length > max) errors.push(`${field} must not exceed ${max} characters`); if (result && htmlPattern.test(result)) errors.push(`${field} must be plain text`); return result;
};
const bool = (value, field, errors) => { if (typeof value !== 'boolean') { errors.push(`${field} must be boolean`); return undefined; } return value; };
const integer = (value, field, errors, min = 1, max = 100) => { const number = Number(value); if (!Number.isInteger(number) || number < min || number > max) { errors.push(`${field} is invalid`); return undefined; } return number; };
const url = (value, field, errors) => { const result = plain(value, field, 2000, errors); if (!result) return result; try { const parsed = new URL(result); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); } catch { errors.push(`${field} is invalid`); } return result; };
const email = (value, field, errors) => { const result = plain(value, field, 254, errors)?.toLowerCase(); if (result && !emailPattern.test(result)) errors.push(`${field} is invalid`); return result; };

const validateSimple = (body, config, errors) => {
  rejectUnknown(body, Object.keys(config), errors);
  const result = {};
  for (const [field, rule] of Object.entries(config)) if (body[field] !== undefined) result[field] = rule(body[field], field, errors);
  return result;
};
const textRule = (max) => (value, field, errors) => plain(value, field, max, errors);
const boolRule = (value, field, errors) => bool(value, field, errors);
const pageRule = (value, field, errors) => integer(value, field, errors, 1, 100);

const image = (value, field, errors) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) { errors.push(`${field} must be an object`); return undefined; }
  rejectUnknown(value, ['url', 'publicId'], errors, `${field}.`);
  const result = {}; if (value.url !== undefined) result.url = url(value.url, `${field}.url`, errors); if (value.publicId !== undefined) result.publicId = plain(value.publicId, `${field}.publicId`, 300, errors); return result;
};

const validators = {
  general: (body, errors) => {
    const result = validateSimple(body, { siteName: textRule(200), siteNameBn: textRule(200), tagline: textRule(300), taglineBn: textRule(300), defaultLanguage: textRule(5), timezone: textRule(80), dateFormat: textRule(30), currency: textRule(3) }, errors);
    if (result.defaultLanguage && !['bn', 'en'].includes(result.defaultLanguage)) errors.push('defaultLanguage is invalid');
    if (result.timezone) { try { new Intl.DateTimeFormat('en', { timeZone: result.timezone }).format(); } catch { errors.push('timezone is invalid'); } }
    if (result.dateFormat && !['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].includes(result.dateFormat)) errors.push('dateFormat is invalid');
    if (result.currency) { result.currency = result.currency.toUpperCase(); if (!CURRENCIES.includes(result.currency)) errors.push('currency is invalid'); }
    return result;
  },
  organization: (body, errors) => {
    const result = validateSimple(body, { name: textRule(200), nameBn: textRule(200), slogan: textRule(300), sloganBn: textRule(300), shortDescription: textRule(1000), aboutSummary: textRule(3000), establishedYear: (value, field, list) => value === null ? null : integer(value, field, list, 1800, new Date().getUTCFullYear()), registrationInfo: textRule(500) }, errors); return result;
  },
  branding: (body, errors) => {
    rejectUnknown(body, ['logo', 'banner', 'favicon', 'primaryColor', 'secondaryColor', 'accentColor'], errors); const result = {};
    for (const field of ['logo', 'banner', 'favicon']) if (body[field] !== undefined) result[field] = image(body[field], field, errors);
    for (const field of ['primaryColor', 'secondaryColor', 'accentColor']) if (body[field] !== undefined) { result[field] = plain(body[field], field, 7, errors); if (result[field] && !colorPattern.test(result[field])) errors.push(`${field} is invalid`); }
    return result;
  },
  contact: (body, errors) => validateSimple(body, { phone: textRule(30), secondaryPhone: textRule(30), email: (v, f) => email(v, f, errors), secondaryEmail: (v, f) => email(v, f, errors), address: textRule(500), village: textRule(100), upazila: textRule(100), district: textRule(100), country: textRule(100), officeHours: textRule(200) }, errors),
  social: (body, errors) => validateSimple(body, { facebook: (v, f) => url(v, f, errors), youtube: (v, f) => url(v, f, errors), instagram: (v, f) => url(v, f, errors), whatsapp: (v, f) => url(v, f, errors), linkedin: (v, f) => url(v, f, errors) }, errors),
  membership: (body, errors) => {
    rejectUnknown(body, ['applicationsEnabled', 'allowedTypes', 'requirePhone', 'requireEmail', 'requireProfilePhoto', 'requireIdentityVerification', 'memberIdPrefix', 'applicationMessage'], errors); const result = {};
    for (const field of ['applicationsEnabled', 'requirePhone', 'requireEmail', 'requireProfilePhoto', 'requireIdentityVerification']) if (body[field] !== undefined) result[field] = bool(body[field], field, errors);
    if (body.allowedTypes !== undefined) { if (!Array.isArray(body.allowedTypes) || !body.allowedTypes.length || body.allowedTypes.some((type) => !['general', 'expatriate', 'youth', 'honorary'].includes(type))) errors.push('allowedTypes is invalid'); else result.allowedTypes = [...new Set(body.allowedTypes)]; }
    if (body.memberIdPrefix !== undefined) { result.memberIdPrefix = plain(body.memberIdPrefix, 'memberIdPrefix', 10, errors)?.toUpperCase(); if (result.memberIdPrefix && !prefixPattern.test(result.memberIdPrefix)) errors.push('memberIdPrefix is invalid'); }
    if (body.applicationMessage !== undefined) result.applicationMessage = plain(body.applicationMessage, 'applicationMessage', 1000, errors);
    return result;
  },
  donation: (body, errors) => {
    rejectUnknown(body, ['enabled', 'allowAnonymous', 'defaultCurrency', 'supportedCurrencies', 'minimumAmount', 'publicMessage', 'paymentMethods', 'showPublicDonorNames', 'showPublicAmounts'], errors); const result = {};
    for (const field of ['enabled', 'allowAnonymous', 'showPublicDonorNames', 'showPublicAmounts']) if (body[field] !== undefined) result[field] = bool(body[field], field, errors);
    if (body.defaultCurrency !== undefined) { result.defaultCurrency = plain(body.defaultCurrency, 'defaultCurrency', 3, errors)?.toUpperCase(); if (!CURRENCIES.includes(result.defaultCurrency)) errors.push('defaultCurrency is invalid'); }
    if (body.supportedCurrencies !== undefined) { if (!Array.isArray(body.supportedCurrencies) || !body.supportedCurrencies.length) errors.push('supportedCurrencies is invalid'); else { result.supportedCurrencies = [...new Set(body.supportedCurrencies.map((item) => typeof item === 'string' ? item.trim().toUpperCase() : ''))]; if (result.supportedCurrencies.some((item) => !CURRENCIES.includes(item))) errors.push('supportedCurrencies is invalid'); } }
    if (body.minimumAmount !== undefined) { try { result.minimumAmount = normalizeAmount(body.minimumAmount); } catch (error) { errors.push(error.message.replace('amount', 'minimumAmount')); } }
    if (body.publicMessage !== undefined) result.publicMessage = plain(body.publicMessage, 'publicMessage', 1000, errors);
    if (body.paymentMethods !== undefined) {
      if (!Array.isArray(body.paymentMethods) || body.paymentMethods.length > 20) errors.push('paymentMethods is invalid'); else result.paymentMethods = body.paymentMethods.map((method, index) => {
        const field = `paymentMethods[${index}]`; if (!method || typeof method !== 'object' || Array.isArray(method)) { errors.push(`${field} is invalid`); return {}; }
        rejectUnknown(method, ['type', 'label', 'accountName', 'accountNumber', 'instructions', 'isEnabled', 'displayOrder'], errors, `${field}.`); const item = {};
        item.type = plain(method.type, `${field}.type`, 50, errors); if (!['bkash', 'nagad', 'bank', 'international-transfer', 'other'].includes(item.type)) errors.push(`${field}.type is invalid`);
        item.label = plain(method.label, `${field}.label`, 100, errors); if (!item.label) errors.push(`${field}.label is required`);
        for (const [name, max] of [['accountName', 120], ['accountNumber', 120], ['instructions', 1000]]) if (method[name] !== undefined) item[name] = plain(method[name], `${field}.${name}`, max, errors);
        if (method.isEnabled !== undefined) item.isEnabled = bool(method.isEnabled, `${field}.isEnabled`, errors); if (method.displayOrder !== undefined) item.displayOrder = integer(method.displayOrder, `${field}.displayOrder`, errors, 0, 10000); return item;
      });
    }
    return result;
  },
  news: (body, errors) => validateSimple(body, { itemsPerPage: pageRule, showFeatured: boolRule, showImportantNoticeBar: boolRule, showPinned: boolRule }, errors),
  activities: (body, errors) => validateSimple(body, { itemsPerPage: pageRule, showFeatured: boolRule, showImpactMetrics: boolRule }, errors),
  gallery: (body, errors) => validateSimple(body, { itemsPerPage: pageRule, showVideos: boolRule, showFeatured: boolRule, requireConsentConfirmation: boolRule }, errors),
  homepage: (body, errors) => {
    const fields = ['showHero', 'showImpactStats', 'showAboutPreview', 'showActivities', 'showNews', 'showGallery', 'showMembershipCTA', 'showDonationCTA']; rejectUnknown(body, [...fields, 'sectionOrder', 'stats'], errors); const result = {};
    for (const field of fields) if (body[field] !== undefined) result[field] = bool(body[field], field, errors);
    const sections = ['hero', 'about', 'stats', 'activities', 'news', 'gallery', 'membership', 'donation'];
    if (body.sectionOrder !== undefined) { if (!Array.isArray(body.sectionOrder) || new Set(body.sectionOrder).size !== body.sectionOrder.length || body.sectionOrder.some((item) => !sections.includes(item))) errors.push('sectionOrder is invalid'); else result.sectionOrder = body.sectionOrder; }
    if (body.stats !== undefined) { if (!body.stats || typeof body.stats !== 'object' || Array.isArray(body.stats)) errors.push('stats is invalid'); else { rejectUnknown(body.stats, ['members', 'activities', 'beneficiaries', 'volunteers'], errors, 'stats.'); result.stats = {}; for (const [key, value] of Object.entries(body.stats)) { if (!value || typeof value !== 'object' || Array.isArray(value)) { errors.push(`stats.${key} is invalid`); continue; } rejectUnknown(value, ['label', 'value', 'isVisible'], errors, `stats.${key}.`); result.stats[key] = {}; if (value.label !== undefined) result.stats[key].label = plain(value.label, `stats.${key}.label`, 100, errors); if (value.value !== undefined) result.stats[key].value = plain(value.value, `stats.${key}.value`, 50, errors); if (value.isVisible !== undefined) result.stats[key].isVisible = bool(value.isVisible, `stats.${key}.isVisible`, errors); } } }
    return result;
  },
  announcement: (body, errors) => { const result = validateSimple(body, { enabled: boolRule, message: textRule(500), link: (v, f) => url(v, f, errors), type: textRule(20) }, errors); if (result.type && !['info', 'success', 'warning', 'important'].includes(result.type)) errors.push('type is invalid'); return result; },
  maintenance: (body, errors) => validateSimple(body, { enabled: boolRule, message: textRule(500) }, errors),
  legal: (body, errors) => validateSimple(body, { privacyPolicyEnabled: boolRule, privacyContactEmail: (v, f) => email(v, f, errors) }, errors),
};

const validateSettingsSection = (section, body) => {
  const errors = [];
  if (!ALL_SECTIONS.includes(section)) return { errors: ['Unknown settings section'], value: {} };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: ['Request body must be an object'], value: {} };
  if (hasSecretKey(body)) return { errors: ['Secret or credential fields are not allowed in Website Settings'], value: {} };
  const value = validators[section](body, errors);
  return { errors, value };
};

module.exports = { validateSettingsSection, hasSecretKey };
