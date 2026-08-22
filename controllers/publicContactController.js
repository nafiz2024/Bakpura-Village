const ContactMessage = require('../models/ContactMessage');
const { validateContact } = require('../validators/contactValidator');

const submitContact = async (req, res, next) => {
  try {
    const { errors, value } = validateContact(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('; ') });
    }

    const contact = await ContactMessage.create({
      ...value,
      status: 'new',
      priority: 'normal',
      source: 'website',
    });

    return res.status(201).json({
      success: true,
      message: 'Your message has been received successfully',
      referenceId: contact._id.toString(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid contact message data' });
    }
    return next(error);
  }
};

module.exports = { submitContact };
