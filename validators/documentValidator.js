const mongoose = require('mongoose');
const { ALLOWED_DOCUMENT_MIME_TYPES, ALLOWED_DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE } = require('../constants/documentTypes');

const ACCESS_LEVELS = Object.freeze(['public', 'internal', 'restricted', 'highly-restricted']);
const CATEGORIES = Object.freeze(['constitution', 'policy', 'meeting-minutes', 'official-letter', 'report', 'finance', 'member-document', 'committee', 'activity', 'notice', 'administrative', 'other']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const htmlPattern = /<\/?[a-z][^>]*>/i;

const clean = (value, field, max, errors, required = false) => {
  if (value === undefined || value === null) { if (required) errors.push(`${field} is required`); return undefined; }
  if (typeof value !== 'string') { errors.push(`${field} must be a string`); return undefined; }
  const result = value.trim();
  if (required && !result) errors.push(`${field} is required`);
  if (result.length > max) errors.push(`${field} must not exceed ${max} characters`);
  if (result && htmlPattern.test(result)) errors.push(`${field} must be plain text`);
  return result;
};

const validateFile = (input, errors) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) { errors.push('file is required'); return undefined; }
  const file = {};
  file.url = clean(input.url, 'file.url', 2000, errors, true);
  if (file.url) { try { const url = new URL(file.url); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); } catch { errors.push('file.url is invalid'); } }
  file.publicId = clean(input.publicId, 'file.publicId', 300, errors);
  file.originalName = clean(input.originalName, 'file.originalName', 255, errors, true);
  file.mimeType = clean(input.mimeType, 'file.mimeType', 150, errors, true);
  file.extension = clean(input.extension, 'file.extension', 20, errors, true)?.toLowerCase();
  const size = Number(input.size);
  if (!Number.isInteger(size) || size < 1 || size > MAX_DOCUMENT_SIZE) errors.push(`file.size must be between 1 and ${MAX_DOCUMENT_SIZE}`); else file.size = size;
  file.checksum = clean(input.checksum, 'file.checksum', 200, errors);
  if (file.mimeType && !ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimeType)) errors.push('file.mimeType is not allowed');
  if (file.extension && !ALLOWED_DOCUMENT_EXTENSIONS.includes(file.extension)) errors.push('file.extension is not allowed');
  return file;
};

const validateDocument = (body = {}, { partial = false } = {}) => {
  const errors = [], value = {};
  for (const [field, max] of [['title', 200], ['titleBn', 200], ['description', 3000]]) if (!partial || body[field] !== undefined) value[field] = clean(body[field], field, max, errors, field === 'title');
  if (!partial || body.category !== undefined) {
    const category = clean(body.category, 'category', 80, errors, true);
    if (category && !CATEGORIES.includes(category)) errors.push('category is invalid'); else value.category = category;
  }
  if (body.accessLevel !== undefined) { if (!ACCESS_LEVELS.includes(body.accessLevel)) errors.push('accessLevel is invalid'); else value.accessLevel = body.accessLevel; }
  if (body.slug !== undefined) {
    const slug = clean(body.slug, 'slug', 160, errors);
    if (slug && !slugPattern.test(slug)) errors.push('slug is invalid'); else value.slug = slug || undefined;
  }
  if (!partial || body.file !== undefined) value.file = validateFile(body.file, errors);
  for (const field of ['relatedMember', 'relatedActivity', 'relatedCommittee', 'relatedFinanceTransaction']) if (body[field] !== undefined) {
    if (body[field] && !mongoose.Types.ObjectId.isValid(body[field])) errors.push(`${field} is invalid`); else value[field] = body[field] || null;
  }
  return { errors, value };
};

const validateVersion = (body = {}) => {
  const errors = [], file = validateFile(body.file, errors), changeNote = clean(body.changeNote, 'changeNote', 1000, errors);
  return { errors, value: { file, changeNote } };
};

const validateReason = (body = {}) => {
  const errors = [], rejectionReason = clean(body.rejectionReason, 'rejectionReason', 1000, errors, true);
  return { errors, value: rejectionReason };
};

module.exports = { ACCESS_LEVELS, CATEGORIES, validateDocument, validateVersion, validateReason };
