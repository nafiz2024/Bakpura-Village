const Donation = require('../models/Donation');
const { validateDonation } = require('../validators/donationValidator');
const { getOrCreateSettings } = require('../services/settingsService');
const { amountAtLeast } = require('../utils/money');

const submit = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    if (!settings.donation.enabled) return res.status(503).json({ success: false, message: 'Donation submissions are currently unavailable' });
    const { errors, value } = validateDonation(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
    if (!settings.donation.supportedCurrencies.includes(value.currency)) return res.status(400).json({ success: false, message: 'currency is not currently supported' });
    if (!amountAtLeast(value.amount, settings.donation.minimumAmount)) return res.status(400).json({ success: false, message: `amount must be at least ${settings.donation.minimumAmount}` });
    if (value.donor.isAnonymous && !settings.donation.allowAnonymous) return res.status(400).json({ success: false, message: 'Anonymous donations are currently disabled' });
    const enabledMethods = settings.donation.paymentMethods.filter((method) => method.isEnabled);
    if (enabledMethods.length && !enabledMethods.some((method) => method.type === value.paymentMethod)) return res.status(400).json({ success: false, message: 'paymentMethod is not currently enabled' });
    const donation = await Donation.create({ ...value, status: 'pending', source: 'website' });
    return res.status(201).json({
      success: true,
      message: 'Donation information submitted successfully and is awaiting verification.',
      referenceId: donation._id.toString(),
      status: 'pending',
    });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Invalid donation data' });
    return next(error);
  }
};

module.exports = { submit };
