const validateEnv = () => {
  const missingVariables = ['NODE_ENV', 'MONGO_URI', 'PORT', 'CLIENT_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN'].filter(
    (name) => !process.env[name] || !process.env[name].trim(),
  );

  if (missingVariables.includes('MONGO_URI')) {
    throw new Error('MongoDB URI must be added to .env before starting the server.');
  }

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
  }

  if (!['development', 'test', 'production'].includes(process.env.NODE_ENV)) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }

  if (!/^\d+(?:ms|s|m|h|d|w|y)$/.test(process.env.JWT_EXPIRES_IN)) {
    throw new Error('JWT_EXPIRES_IN must use a duration such as 7d or 12h.');
  }

  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  let clientUrl;
  try {
    clientUrl = new URL(process.env.CLIENT_URL);
  } catch {
    throw new Error('CLIENT_URL must be a valid URL.');
  }

  if (!['http:', 'https:'].includes(clientUrl.protocol)) {
    throw new Error('CLIENT_URL must use the http or https protocol.');
  }

  if (process.env.CLIENT_URL.trim() === '*') {
    throw new Error('CLIENT_URL cannot be a wildcard when credentialed CORS is enabled.');
  }
};

module.exports = validateEnv;
