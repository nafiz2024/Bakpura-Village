const { validateMemberPayload } = require('./memberValidator');

const validateApplication = (body) => {
  const allowed = {
    fullName: body.fullName, fatherName: body.fatherName, motherName: body.motherName,
    dateOfBirth: body.dateOfBirth, gender: body.gender, contact: body.contact,
    membership: body.membership, professional: body.professional, expatriate: body.expatriate,
  };
  const result = validateMemberPayload(allowed);
  delete result.value.status;
  return result;
};

const meaningfulText = (value) => typeof value === 'string' && value.trim().length >= 5;
module.exports = { validateApplication, meaningfulText };
