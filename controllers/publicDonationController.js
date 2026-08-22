const Donation = require('../models/Donation');
const { validateDonation } = require('../validators/donationValidator');

const submit = async (req, res, next) => {
  try {
    const { errors, value } = validateDonation(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
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
