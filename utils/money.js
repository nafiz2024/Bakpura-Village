const mongoose = require('mongoose');

const amountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

const normalizeAmount = (input) => {
  const raw = typeof input === 'number' ? String(input) : typeof input === 'string' ? input.trim() : '';
  if (!amountPattern.test(raw)) throw new Error('amount must be a positive number with at most 2 decimal places');
  const [whole, fraction = ''] = raw.split('.');
  if (whole === '0' && (!fraction || /^0+$/.test(fraction))) throw new Error('amount must be greater than zero');
  return `${whole}.${fraction.padEnd(2, '0')}`;
};

const toDecimal128 = (input) => mongoose.Types.Decimal128.fromString(normalizeAmount(input));

const moneyToString = (input) => {
  if (input === null || input === undefined) return '0.00';
  const raw = typeof input === 'string' ? input : input.toString();
  const [whole, fraction = ''] = raw.split('.');
  return `${whole}.${fraction.padEnd(2, '0').slice(0, 2)}`;
};

module.exports = { normalizeAmount, toDecimal128, moneyToString };
