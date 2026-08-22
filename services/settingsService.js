const WebsiteSettings = require('../models/WebsiteSettings');

const SITE_KEY = 'bakpura-main';

const getOrCreateSettings = async () => {
  try {
    return await WebsiteSettings.findOneAndUpdate(
      { siteKey: SITE_KEY },
      { $setOnInsert: { siteKey: SITE_KEY } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error.code === 11000) return WebsiteSettings.findOne({ siteKey: SITE_KEY });
    throw error;
  }
};

module.exports = { SITE_KEY, getOrCreateSettings };
