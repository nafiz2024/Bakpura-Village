const { toDecimal128 } = require('../utils/money');

const CURRENCIES = Object.freeze(['BDT', 'USD', 'GBP', 'EUR', 'SAR', 'AED']);
const PURPOSES = Object.freeze(['general', 'education', 'medical', 'relief', 'community-development', 'activity', 'other']);
const PAYMENT_METHODS = Object.freeze(['cash', 'bank', 'bkash', 'nagad', 'card', 'international-transfer', 'other']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9][0-9\s().-]{5,28}[0-9]$/;
const htmlPattern = /<\/?[a-z][^>]*>/i;

const text = (body, field, max, errors, required = false) => {
  if (body[field] === undefined || body[field] === null) {
    if (required) errors.push(`${field} is required`);
    return '';
  }
  if (typeof body[field] !== 'string') {
    errors.push(`${field} must be a string`);
    return '';
  }
  const value = body[field].trim();
  if (required && !value) errors.push(`${field} is required`);
  if (value.length > max) errors.push(`${field} must not exceed ${max} characters`);
  if (value && htmlPattern.test(value)) errors.push(`${field} must be plain text`);
  return value;
};

const validateDonation = (body = {}) => {
  const errors = [];
  const value = {};
  try { value.amount = toDecimal128(body.amount); } catch (error) { errors.push(error.message); }
  const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : 'BDT';
  if (!CURRENCIES.includes(currency)) errors.push('currency is invalid'); else value.currency = currency;
  const purpose = body.purpose === undefined ? 'general' : text(body, 'purpose', 50, errors);
  if (!PURPOSES.includes(purpose)) errors.push('purpose is invalid'); else value.purpose = purpose;
  const paymentMethod = text(body, 'paymentMethod', 50, errors, true);
  if (!PAYMENT_METHODS.includes(paymentMethod)) errors.push('paymentMethod is invalid'); else value.paymentMethod = paymentMethod;
  const name = text(body, 'name', 120, errors);
  const phone = text(body, 'phone', 30, errors);
  const email = text(body, 'email', 254, errors).toLowerCase();
  const country = text(body, 'country', 80, errors);
  if (phone && !phonePattern.test(phone)) errors.push('phone is invalid');
  if (email && !emailPattern.test(email)) errors.push('email is invalid');
  if (body.isAnonymous !== undefined && typeof body.isAnonymous !== 'boolean') errors.push('isAnonymous must be boolean');
  const isAnonymous = body.isAnonymous === true;
  if (!isAnonymous && !name) errors.push('name is required unless donating anonymously');
  if (!phone && !email) errors.push('phone or email is required');
  value.donor = { name, phone, email, country, isAnonymous };
  value.transactionReference = text(body, 'transactionReference', 120, errors);
  value.note = text(body, 'note', 1000, errors);
  return { errors, value };
};

module.exports = { CURRENCIES, PURPOSES, PAYMENT_METHODS, validateDonation };
