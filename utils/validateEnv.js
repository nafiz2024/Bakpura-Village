const validateEnv = () => {
  const missingVariables = ['MONGO_URI', 'PORT', 'CLIENT_URL', 'JWT_SECRET'].filter(
    (name) => !process.env[name] || !process.env[name].trim(),
  );

  if (missingVariables.includes('MONGO_URI')) {
    throw new Error('MongoDB URI must be added to .env before starting the server.');
  }

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
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
};

module.exports = validateEnv;
