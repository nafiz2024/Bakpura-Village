const { getOrCreateSettings } = require('../services/settingsService');
const { ALL_SECTIONS, readableSections, canManageSection } = require('../services/settingsAccessService');
const { validateSettingsSection } = require('../validators/settingsValidator');

const selectSections = (settings, sections) => {
  const source = settings.toObject();
  return { version: source.version, updatedAt: source.updatedAt, sections: Object.fromEntries(sections.map((section) => [section, source[section]])) };
};

const getAll = async (req, res, next) => {
  try {
    const sections = readableSections(req.admin);
    if (!sections.length) return res.status(403).json({ success: false, message: 'You do not have access to Website Settings' });
    const settings = await getOrCreateSettings();
    return res.json({ success: true, data: selectSections(settings, sections) });
  } catch (error) { return next(error); }
};

const getSection = async (req, res, next) => {
  try {
    if (!ALL_SECTIONS.includes(req.params.section)) return res.status(400).json({ success: false, message: 'Unknown settings section' });
    if (!readableSections(req.admin).includes(req.params.section)) return res.status(403).json({ success: false, message: 'You do not have access to this settings section' });
    const settings = await getOrCreateSettings();
    return res.json({ success: true, data: settings[req.params.section] });
  } catch (error) { return next(error); }
};

const updateSection = async (req, res, next) => {
  try {
    const { section } = req.params;
    if (!ALL_SECTIONS.includes(section)) return res.status(400).json({ success: false, message: 'Unknown settings section' });
    if (!canManageSection(req.admin, section)) return res.status(403).json({ success: false, message: 'You cannot manage this settings section' });
    const { errors, value } = validateSettingsSection(section, req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
    const settings = await getOrCreateSettings();
    const current = settings[section]?.toObject ? settings[section].toObject() : settings[section] || {};
    const merged = { ...current, ...value };
    if (section === 'branding') for (const field of ['logo', 'banner', 'favicon']) if (value[field]) merged[field] = { ...(current[field] || {}), ...value[field] };
    if (section === 'homepage' && value.stats) merged.stats = { ...(current.stats || {}), ...Object.fromEntries(Object.entries(value.stats).map(([key, item]) => [key, { ...(current.stats?.[key] || {}), ...item }])) };
    if (section === 'donation') {
      const currencies = merged.supportedCurrencies || [];
      if (!currencies.includes(merged.defaultCurrency)) return res.status(400).json({ success: false, message: 'defaultCurrency must be included in supportedCurrencies' });
    }
    settings.set(section, merged);
    settings.updatedBy = req.admin._id;
    settings.version += 1;
    await settings.save();
    return res.json({ success: true, data: settings[section], version: settings.version });
  } catch (error) { return next(error); }
};

module.exports = { getAll, getSection, updateSection };
