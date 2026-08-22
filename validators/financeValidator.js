const mongoose = require('mongoose');
const { toDecimal128 } = require('../utils/money');
const { CURRENCIES, PAYMENT_METHODS } = require('./donationValidator');

const INCOME_CATEGORIES = Object.freeze(['donation', 'member-contribution', 'membership-fee', 'other-income']);
const EXPENSE_CATEGORIES = Object.freeze(['activity-expense', 'relief-expense', 'administrative-expense', 'operational-expense', 'other-expense']);
const htmlPattern = /<\/?[a-z][^>]*>/i;

const clean = (value, max, field, errors, required = false) => {
  if (value === undefined || value === null) {
    if (required) errors.push(`${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string') { errors.push(`${field} must be a string`); return undefined; }
  const result = value.trim();
  if (required && !result) errors.push(`${field} is required`);
  if (result.length > max) errors.push(`${field} must not exceed ${max} characters`);
  if (result && htmlPattern.test(result)) errors.push(`${field} must be plain text`);
  return result;
};

const validateTransaction = (body = {}, { partial = false } = {}) => {
  const errors = [], value = {};
  if (!partial || body.type !== undefined) {
    if (!['income', 'expense'].includes(body.type)) errors.push('type is invalid'); else value.type = body.type;
  }
  if (!partial || body.category !== undefined) value.category = clean(body.category, 80, 'category', errors, true);
  const type = value.type || body.type;
  if (value.category && type === 'income' && !INCOME_CATEGORIES.includes(value.category)) errors.push('category is invalid for income');
  if (value.category && type === 'expense' && !EXPENSE_CATEGORIES.includes(value.category)) errors.push('category is invalid for expense');
  if (!partial || body.amount !== undefined) { try { value.amount = toDecimal128(body.amount); } catch (error) { errors.push(error.message); } }
  if (!partial || body.currency !== undefined) {
    const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : 'BDT';
    if (!CURRENCIES.includes(currency)) errors.push('currency is invalid'); else value.currency = currency;
  }
  if (!partial || body.description !== undefined) value.description = clean(body.description, 500, 'description', errors, true);
  if (!partial || body.paymentMethod !== undefined) {
    const method = clean(body.paymentMethod, 50, 'paymentMethod', errors, true);
    if (method && !PAYMENT_METHODS.includes(method)) errors.push('paymentMethod is invalid'); else value.paymentMethod = method;
  }
  if (body.reference !== undefined) value.reference = clean(body.reference, 120, 'reference', errors);
  if (!partial || body.transactionDate !== undefined) {
    const date = body.transactionDate === undefined ? new Date() : new Date(body.transactionDate);
    if (Number.isNaN(date.getTime())) errors.push('transactionDate is invalid'); else value.transactionDate = date;
  }
  for (const field of ['relatedMember', 'relatedActivity']) if (body[field] !== undefined) {
    if (body[field] && !mongoose.Types.ObjectId.isValid(body[field])) errors.push(`${field} is invalid`);
    else value[field] = body[field] || null;
  }
  return { errors, value };
};

const validateReason = (body, field) => {
  const errors = [];
  const value = clean(body?.[field], 1000, field, errors, true);
  return { errors, value };
};

module.exports = { INCOME_CATEGORIES, EXPENSE_CATEGORIES, validateTransaction, validateReason };
