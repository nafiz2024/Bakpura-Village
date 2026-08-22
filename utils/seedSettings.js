require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { getOrCreateSettings } = require('../services/settingsService');

(async () => {
  try {
    await connectDB();
    const settings = await getOrCreateSettings();
    console.log(`Website settings initialized: ${settings.siteKey}`);
  } catch (error) {
    console.error(`Settings initialization failed: ${error.message}`);
    process.exitCode = 1;
  } finally { await mongoose.disconnect().catch(() => {}); }
})();
