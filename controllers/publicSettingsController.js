const { getOrCreateSettings } = require('../services/settingsService');
const { publicSettings } = require('../services/publicSettingsService');

const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.set('Cache-Control', 'public, max-age=60');
    return res.json({ success: true, data: publicSettings(settings) });
  } catch (error) { return next(error); }
};

module.exports = { getPublicSettings };
