const serializeApplicationList = (app) => ({
  id: app._id.toString(), fullName: app.fullName,
  contact: { phone: app.contact?.phone, email: app.contact?.email, country: app.contact?.country },
  membership: { type: app.membership?.type }, status: app.status,
  assignedReviewer: app.assignedReviewer || null, createdAt: app.createdAt, updatedAt: app.updatedAt,
});

const serializeApplicationDetail = (app) => {
  const value = app.toObject ? app.toObject() : app;
  delete value.__v;
  return { ...value, id: value._id.toString(), _id: undefined };
};

const toMemberData = (app) => ({
  fullName: app.fullName, fatherName: app.fatherName, motherName: app.motherName,
  dateOfBirth: app.dateOfBirth, gender: app.gender, contact: app.contact,
  membership: { type: app.membership?.type, reasonForJoining: app.membership?.reasonForJoining },
  professional: app.professional, expatriate: app.expatriate,
});
module.exports = { serializeApplicationList, serializeApplicationDetail, toMemberData };
