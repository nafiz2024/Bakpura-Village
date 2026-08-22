const GENDERS = new Set(['male', 'female', 'other', 'prefer-not-to-say']);
const MEMBERSHIP_TYPES = new Set(['general', 'expatriate', 'youth', 'honorary']);
const IDENTITY_TYPES = new Set(['nid', 'passport', 'birth-certificate', 'other']);
const CREATE_STATUSES = new Set(['active', 'inactive']);

const cleanString = (value) => (typeof value === 'string' ? value.trim() : undefined);

const normalizePhone = (value) => {
  const phone = cleanString(value);
  if (!phone) return undefined;
  return phone.replace(/[\s().-]/g, '');
};

const isValidPhone = (phone) => /^\+?\d{7,15}$/.test(phone);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const parseDate = (value, field, errors, { futureAllowed = true } = {}) => {
  if (value === undefined || value === null || value === '') return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    errors.push(`${field} must be a valid date`);
    return undefined;
  }
  if (!futureAllowed && date > new Date()) errors.push(`${field} cannot be in the future`);
  return date;
};

const validateUrl = (value, field, errors) => {
  const text = cleanString(value);
  if (!text) return undefined;
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch {
    errors.push(`${field} must be a valid HTTP or HTTPS URL`);
  }
  return text;
};

const validateMemberPayload = (body, { partial = false } = {}) => {
  const errors = [];
  const value = {};
  const fullName = cleanString(body.fullName);

  if (!partial || body.fullName !== undefined) {
    if (!fullName) errors.push('fullName is required');
    else value.fullName = fullName;
  }

  for (const field of ['fatherName', 'motherName']) {
    if (body[field] !== undefined) value[field] = cleanString(body[field]) || undefined;
  }

  if (body.dateOfBirth !== undefined) {
    value.dateOfBirth = parseDate(body.dateOfBirth, 'dateOfBirth', errors, { futureAllowed: false });
  }

  if (body.gender !== undefined) {
    if (body.gender !== '' && !GENDERS.has(body.gender)) errors.push('gender is invalid');
    else value.gender = body.gender || undefined;
  }

  if (body.profilePhoto !== undefined) {
    if (!body.profilePhoto || typeof body.profilePhoto !== 'object' || Array.isArray(body.profilePhoto)) {
      errors.push('profilePhoto must be an object');
    } else {
      value.profilePhoto = {
        url: validateUrl(body.profilePhoto.url, 'profilePhoto.url', errors),
        publicId: cleanString(body.profilePhoto.publicId),
      };
    }
  }

  if (!partial || body.contact !== undefined) {
    if (!body.contact || typeof body.contact !== 'object' || Array.isArray(body.contact)) {
      errors.push('contact is required');
    } else {
      const phone = normalizePhone(body.contact.phone);
      if (!partial && !phone) errors.push('contact.phone is required');
      if (phone && !isValidPhone(phone)) errors.push('contact.phone is invalid');
      const email = cleanString(body.contact.email)?.toLowerCase();
      if (email && !isValidEmail(email)) errors.push('contact.email is invalid');
      value.contact = {};
      if (body.contact.phone !== undefined) value.contact.phone = phone;
      if (body.contact.email !== undefined) value.contact.email = email || undefined;
      for (const field of ['country', 'city', 'village', 'address']) {
        if (body.contact[field] !== undefined) value.contact[field] = cleanString(body.contact[field]) || undefined;
      }
    }
  }

  if (body.membership !== undefined) {
    if (!body.membership || typeof body.membership !== 'object' || Array.isArray(body.membership)) {
      errors.push('membership must be an object');
    } else {
      value.membership = {};
      if (body.membership.type !== undefined) {
        if (!MEMBERSHIP_TYPES.has(body.membership.type)) errors.push('membership.type is invalid');
        else value.membership.type = body.membership.type;
      }
      if (body.membership.joinedAt !== undefined) {
        value.membership.joinedAt = parseDate(body.membership.joinedAt, 'membership.joinedAt', errors);
      }
      if (body.membership.reasonForJoining !== undefined) {
        value.membership.reasonForJoining = cleanString(body.membership.reasonForJoining) || undefined;
      }
    }
  }

  for (const section of ['professional', 'emergencyContact']) {
    if (body[section] !== undefined) {
      if (!body[section] || typeof body[section] !== 'object' || Array.isArray(body[section])) {
        errors.push(`${section} must be an object`);
      } else {
        const fields = section === 'professional' ? ['occupation', 'organization'] : ['name', 'relationship'];
        value[section] = {};
        for (const field of fields) {
          if (body[section][field] !== undefined) value[section][field] = cleanString(body[section][field]) || undefined;
        }
        if (section === 'emergencyContact' && body[section].phone !== undefined) {
          const phone = normalizePhone(body[section].phone);
          if (phone && !isValidPhone(phone)) errors.push('emergencyContact.phone is invalid');
          value[section].phone = phone;
        }
      }
    }
  }

  if (body.expatriate !== undefined) {
    if (!body.expatriate || typeof body.expatriate !== 'object' || Array.isArray(body.expatriate)) {
      errors.push('expatriate must be an object');
    } else {
      value.expatriate = {};
      if (body.expatriate.isExpatriate !== undefined) {
        if (typeof body.expatriate.isExpatriate !== 'boolean') errors.push('expatriate.isExpatriate must be boolean');
        else value.expatriate.isExpatriate = body.expatriate.isExpatriate;
      }
      for (const field of ['country', 'city', 'profession']) {
        if (body.expatriate[field] !== undefined) value.expatriate[field] = cleanString(body.expatriate[field]) || undefined;
      }
    }
  }

  if (body.identityVerification !== undefined) {
    const identity = body.identityVerification;
    if (!identity || typeof identity !== 'object' || Array.isArray(identity)) {
      errors.push('identityVerification must be an object');
    } else {
      value.identityVerification = {};
      if (identity.type !== undefined) {
        if (!IDENTITY_TYPES.has(identity.type)) errors.push('identityVerification.type is invalid');
        else value.identityVerification.type = identity.type;
      }
      if (identity.number !== undefined) value.identityVerification.number = cleanString(identity.number) || undefined;
      if (identity.verified !== undefined) {
        if (typeof identity.verified !== 'boolean') errors.push('identityVerification.verified must be boolean');
        else value.identityVerification.verified = identity.verified;
      }
    }
  }

  if (!partial && body.status !== undefined) {
    if (!CREATE_STATUSES.has(body.status)) errors.push('status must be active or inactive');
    else value.status = body.status;
  }

  return { errors, value };
};

module.exports = { validateMemberPayload, normalizePhone, isValidEmail };
