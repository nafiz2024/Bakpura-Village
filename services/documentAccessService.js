const { PERMISSIONS } = require('../constants/permissions');

const permissionForAction = {
  view: PERMISSIONS.DOCUMENTS.VIEW,
  edit: PERMISSIONS.DOCUMENTS.EDIT,
  download: PERMISSIONS.DOCUMENTS.DOWNLOAD,
  changeAccess: PERMISSIONS.DOCUMENTS.CHANGE_ACCESS,
  approve: PERMISSIONS.DOCUMENTS.APPROVE,
};

const isFinanceDocument = (document) => document.category === 'finance' || Boolean(document.relatedFinanceTransaction);
const isMemberDocument = (document) => document.category === 'member-document' || Boolean(document.relatedMember);

const resourceFilterForAdmin = (admin) => {
  if (admin.role === 'super-admin') return {};
  if (admin.role === 'finance-admin') return { $or: [{ category: 'finance' }, { relatedFinanceTransaction: { $ne: null } }] };
  if (admin.role === 'content-admin') return { accessLevel: 'public', category: { $nin: ['finance', 'member-document'] }, relatedMember: null, relatedFinanceTransaction: null };
  return { accessLevel: { $ne: 'highly-restricted' }, category: { $nin: ['finance', 'member-document'] }, relatedMember: null, relatedFinanceTransaction: null };
};

const canAccessDocument = (admin, permissions, document, action = 'view') => {
  if (!admin || !permissions?.includes(permissionForAction[action])) return false;
  if (admin.role === 'super-admin') return true;
  if (isMemberDocument(document)) return false;
  if (isFinanceDocument(document)) return admin.role === 'finance-admin';
  if (document.accessLevel === 'highly-restricted') return false;
  if (admin.role === 'content-admin') return document.accessLevel === 'public';
  return admin.role === 'management-admin';
};

const canChangeAccessLevel = (admin, permissions, document, targetLevel) => {
  if (!canAccessDocument(admin, permissions, document, 'changeAccess')) return false;
  if (targetLevel === 'public' && (document.accessLevel === 'highly-restricted' || isFinanceDocument(document) || isMemberDocument(document))) return admin.role === 'super-admin';
  return admin.role === 'super-admin' || admin.role === 'management-admin' || (admin.role === 'finance-admin' && isFinanceDocument(document));
};

module.exports = { resourceFilterForAdmin, canAccessDocument, canChangeAccessLevel };
