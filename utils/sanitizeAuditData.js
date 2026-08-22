const SENSITIVE_KEYS = Object.freeze([
  'password', 'passwordhash', 'token', 'jwt', 'authorization', 'cookie', 'secret', 'apikey', 'apisecret', 'jwtsecret', 'mongouri',
  'identityverification.number', 'passport', 'nid', 'bankaccount', 'paymentcredential', 'otp', 'pin', 'privatekey', 'file.url',
  'publicid', 'transactionreference', 'paymentreference', 'accountnumber',
]);

const normalizedKey = (key) => String(key).replace(/[^a-z0-9.]/gi, '').toLowerCase();
const isSensitive = (key, path) => {
  const normalized = normalizedKey(key), fullPath = normalizedKey(path ? `${path}.${key}` : key);
  return SENSITIVE_KEYS.some((entry) => normalized === entry || fullPath.endsWith(entry) || normalized.includes(entry));
};

const sanitizeAuditData = (value, path = '', depth = 0) => {
  if (depth > 6) return '[TRUNCATED]';
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return value.slice(0, 500);
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeAuditData(item, path, depth + 1));
  if (typeof value === 'object') {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      if (isSensitive(key, path)) continue;
      result[key] = sanitizeAuditData(child, path ? `${path}.${key}` : key, depth + 1);
    }
    return result;
  }
  return undefined;
};

module.exports = { SENSITIVE_KEYS, sanitizeAuditData };
