const CATEGORIES = Object.freeze([
  'general',
  'membership',
  'donation',
  'activity',
  'complaint',
  'suggestion',
  'support',
  'other',
]);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9][0-9\s().-]{5,28}[0-9]$/;
const htmlPattern = /<\/?[a-z][^>]*>/i;

const readPlainText = (body, field, maxLength, errors, { required = false } = {}) => {
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
  if (value.length > maxLength) errors.push(`${field} must not exceed ${maxLength} characters`);
  if (value && htmlPattern.test(value)) errors.push(`${field} must be plain text`);
  return value;
};

const validateContact = (body = {}) => {
  const errors = [];
  const value = {
    name: readPlainText(body, 'name', 120, errors, { required: true }),
    phone: readPlainText(body, 'phone', 30, errors),
    email: readPlainText(body, 'email', 254, errors).toLowerCase(),
    subject: readPlainText(body, 'subject', 200, errors, { required: true }),
    message: readPlainText(body, 'message', 5000, errors, { required: true }),
  };

  if (!value.phone && !value.email) errors.push('phone or email is required');
  if (value.phone && !phonePattern.test(value.phone)) errors.push('phone is invalid');
  if (value.email && !emailPattern.test(value.email)) errors.push('email is invalid');

  const category = body.category === undefined ? 'general' : readPlainText(body, 'category', 30, errors);
  if (!CATEGORIES.includes(category)) errors.push('category is invalid');
  else value.category = category;

  return { errors, value };
};

const validateNote = (body = {}) => {
  const errors = [];
  const note = readPlainText(body, 'note', 2000, errors, { required: true });
  return { errors, value: { note } };
};

module.exports = { CATEGORIES, validateContact, validateNote };
