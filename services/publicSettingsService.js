const { ALL_SECTIONS } = require('./settingsAccessService');

const publicSettings = (settings) => {
  const source = settings.toObject ? settings.toObject() : settings;
  const result = Object.fromEntries(ALL_SECTIONS.map((section) => [section, source[section]]));
  result.branding = {
    logo: { url: source.branding?.logo?.url || '' }, banner: { url: source.branding?.banner?.url || '' }, favicon: { url: source.branding?.favicon?.url || '' },
    primaryColor: source.branding?.primaryColor, secondaryColor: source.branding?.secondaryColor, accentColor: source.branding?.accentColor,
  };
  result.donation = {
    ...source.donation,
    paymentMethods: (source.donation?.paymentMethods || []).filter((method) => method.isEnabled).sort((a, b) => a.displayOrder - b.displayOrder).map((method) => ({
      type: method.type, label: method.label, accountName: method.accountName, accountNumber: method.accountNumber,
      instructions: method.instructions, isEnabled: true, displayOrder: method.displayOrder,
    })),
  };
  return result;
};

module.exports = { publicSettings };
