const { AUDIT_ACTIONS: A } = require('../constants/auditActions');
const { logAuditEvent } = require('../services/auditService');
const { sanitizeAuditData } = require('../utils/sanitizeAuditData');

const rules = [
  ['POST', /^\/api\/admin\/admin-users$/, A.ADMINS.CREATE, 'admins', 'admin'],
  ['PATCH', /^\/api\/admin\/admin-users\/([^/]+)\/role$/, A.ADMINS.ROLE_CHANGE, 'admins', 'admin'],
  ['POST', /^\/api\/admin\/admin-users\/([^/]+)\/disable$/, A.ADMINS.DISABLE, 'admins', 'admin'],
  ['POST', /^\/api\/admin\/admin-users\/([^/]+)\/enable$/, A.ADMINS.ENABLE, 'admins', 'admin'],
  ['PATCH', /^\/api\/admin\/admin-users\/([^/]+)$/, A.ADMINS.UPDATE, 'admins', 'admin'],
  ['POST', /^\/api\/admin\/roles$/, A.ROLES.CREATE, 'roles', 'role'],
  ['PATCH', /^\/api\/admin\/roles\/([^/]+)$/, A.ROLES.UPDATE, 'roles', 'role'],
  ['POST', /^\/api\/admin\/roles\/([^/]+)\/deactivate$/, A.ROLES.DEACTIVATE, 'roles', 'role'],
  ['POST', /^\/api\/admin\/members$/, A.MEMBERS.CREATE, 'members', 'member'],
  ['PATCH', /^\/api\/admin\/members\/([^/]+)\/status$/, A.MEMBERS.STATUS_CHANGE, 'members', 'member'],
  ['POST', /^\/api\/admin\/members\/([^/]+)\/archive$/, A.MEMBERS.ARCHIVE, 'members', 'member'],
  ['POST', /^\/api\/admin\/members\/([^/]+)\/restore$/, A.MEMBERS.RESTORE, 'members', 'member'],
  ['PATCH', /^\/api\/admin\/members\/([^/]+)$/, A.MEMBERS.UPDATE, 'members', 'member'],
  ['PATCH', /^\/api\/admin\/membership-applications\/([^/]+)\/review$/, A.APPLICATIONS.REVIEW, 'applications', 'membership-application'],
  ['PATCH', /^\/api\/admin\/membership-applications\/([^/]+)\/assign$/, A.APPLICATIONS.ASSIGN, 'applications', 'membership-application'],
  ['PATCH', /^\/api\/admin\/membership-applications\/([^/]+)\/request-info$/, A.APPLICATIONS.REQUEST_INFO, 'applications', 'membership-application'],
  ['POST', /^\/api\/admin\/membership-applications\/([^/]+)\/approve$/, A.APPLICATIONS.APPROVE, 'applications', 'membership-application'],
  ['POST', /^\/api\/admin\/membership-applications\/([^/]+)\/reject$/, A.APPLICATIONS.REJECT, 'applications', 'membership-application'],
  ['POST', /^\/api\/admin\/membership-applications\/([^/]+)\/archive$/, A.APPLICATIONS.ARCHIVE, 'applications', 'membership-application'],
  ['POST', /^\/api\/admin\/committees$/, A.COMMITTEE.CREATE, 'committee', 'committee'],
  ['PATCH', /^\/api\/admin\/committees\/([^/]+)$/, A.COMMITTEE.UPDATE, 'committee', 'committee'],
  ['PATCH', /^\/api\/admin\/committees\/([^/]+)\/status$/, A.COMMITTEE.STATUS_CHANGE, 'committee', 'committee'],
  ['POST', /^\/api\/admin\/committees\/([^/]+)\/members$/, A.COMMITTEE.MEMBER_ADD, 'committee', 'committee-member'],
  ['PATCH', /^\/api\/admin\/committees\/([^/]+)\/members\/([^/]+)$/, A.COMMITTEE.MEMBER_UPDATE, 'committee', 'committee-member'],
  ['POST', /^\/api\/admin\/committees\/([^/]+)\/members\/([^/]+)\/archive$/, A.COMMITTEE.MEMBER_ARCHIVE, 'committee', 'committee-member'],
  ['POST', /^\/api\/admin\/committees\/([^/]+)\/members\/([^/]+)\/restore$/, A.COMMITTEE.MEMBER_RESTORE, 'committee', 'committee-member'],
  ['PATCH', /^\/api\/admin\/committees\/([^/]+)\/reorder$/, A.COMMITTEE.REORDER, 'committee', 'committee'],
  ['POST', /^\/api\/admin\/activities$/, A.ACTIVITIES.CREATE, 'activities', 'activity'],
  ['PATCH', /^\/api\/admin\/activities\/([^/]+)$/, A.ACTIVITIES.UPDATE, 'activities', 'activity'],
  ['POST', /^\/api\/admin\/activities\/([^/]+)\/(publish|unpublish|archive|restore)$/, null, 'activities', 'activity'],
  ['PATCH', /^\/api\/admin\/activities\/([^/]+)\/featured$/, A.ACTIVITIES.FEATURE_CHANGE, 'activities', 'activity'],
  ['POST', /^\/api\/admin\/news$/, A.NEWS.CREATE, 'news', 'news'],
  ['PATCH', /^\/api\/admin\/news\/([^/]+)$/, A.NEWS.UPDATE, 'news', 'news'],
  ['POST', /^\/api\/admin\/news\/([^/]+)\/(publish|unpublish|archive|restore)$/, null, 'news', 'news'],
  ['PATCH', /^\/api\/admin\/news\/([^/]+)\/(pinned|flags)$/, A.NEWS.FLAG_CHANGE, 'news', 'news'],
  ['POST', /^\/api\/admin\/gallery\/albums$/, A.GALLERY.ALBUM_CREATE, 'gallery', 'gallery-album'],
  ['PATCH', /^\/api\/admin\/gallery\/albums\/([^/]+)$/, A.GALLERY.ALBUM_UPDATE, 'gallery', 'gallery-album'],
  ['POST', /^\/api\/admin\/gallery\/albums\/([^/]+)\/(publish|unpublish|archive|restore)$/, null, 'gallery', 'gallery-album'],
  ['PATCH', /^\/api\/admin\/gallery\/albums\/([^/]+)\/reorder$/, A.GALLERY.REORDER, 'gallery', 'gallery-album'],
  ['POST', /^\/api\/admin\/gallery\/media$/, A.GALLERY.MEDIA_ADD, 'gallery', 'gallery-media'],
  ['PATCH', /^\/api\/admin\/gallery\/media\/([^/]+)$/, A.GALLERY.MEDIA_UPDATE, 'gallery', 'gallery-media'],
  ['PATCH', /^\/api\/admin\/gallery\/media\/([^/]+)\/(status|flags)$/, A.GALLERY.MEDIA_STATUS, 'gallery', 'gallery-media'],
  ['POST', /^\/api\/admin\/gallery\/media\/([^/]+)\/(archive|restore)$/, null, 'gallery', 'gallery-media'],
  ['PATCH', /^\/api\/admin\/contact-messages\/([^/]+)\/read$/, A.CONTACT.READ, 'contact', 'contact-message'],
  ['PATCH', /^\/api\/admin\/contact-messages\/([^/]+)\/status$/, A.CONTACT.STATUS_CHANGE, 'contact', 'contact-message'],
  ['PATCH', /^\/api\/admin\/contact-messages\/([^/]+)\/priority$/, A.CONTACT.PRIORITY_CHANGE, 'contact', 'contact-message'],
  ['PATCH', /^\/api\/admin\/contact-messages\/([^/]+)\/assign$/, A.CONTACT.ASSIGN, 'contact', 'contact-message'],
  ['POST', /^\/api\/admin\/contact-messages\/([^/]+)\/notes$/, A.CONTACT.NOTE_ADD, 'contact', 'contact-message'],
  ['POST', /^\/api\/admin\/contact-messages\/([^/]+)\/(archive|restore)$/, null, 'contact', 'contact-message'],
  ['POST', /^\/api\/admin\/donations\/([^/]+)\/(verify|reject)$/, null, 'donations', 'donation'],
  ['POST', /^\/api\/admin\/finance\/transactions$/, A.FINANCE.CREATE, 'finance', 'finance-transaction'],
  ['PATCH', /^\/api\/admin\/finance\/transactions\/([^/]+)$/, A.FINANCE.UPDATE, 'finance', 'finance-transaction'],
  ['POST', /^\/api\/admin\/finance\/transactions\/([^/]+)\/(approve|reject|void)$/, null, 'finance', 'finance-transaction'],
  ['POST', /^\/api\/admin\/documents$/, A.DOCUMENTS.CREATE, 'documents', 'document'],
  ['PATCH', /^\/api\/admin\/documents\/([^/]+)$/, A.DOCUMENTS.UPDATE, 'documents', 'document'],
  ['PATCH', /^\/api\/admin\/documents\/([^/]+)\/access$/, A.DOCUMENTS.ACCESS_CHANGE, 'documents', 'document'],
  ['POST', /^\/api\/admin\/documents\/([^/]+)\/versions$/, A.DOCUMENTS.VERSION_ADD, 'documents', 'document'],
  ['POST', /^\/api\/admin\/documents\/([^/]+)\/(submit-for-approval|approve|reject|publish|unpublish|archive|restore)$/, null, 'documents', 'document'],
  ['PATCH', /^\/api\/admin\/settings\/([^/]+)$/, A.SETTINGS.UPDATE, 'settings', 'settings-section'],
];

const dynamicAction = (module, operation, targetType) => {
  const maps = {
    activities: { publish: A.ACTIVITIES.PUBLISH, unpublish: A.ACTIVITIES.UNPUBLISH, archive: A.ACTIVITIES.ARCHIVE, restore: A.ACTIVITIES.RESTORE },
    news: { publish: A.NEWS.PUBLISH, unpublish: A.NEWS.UNPUBLISH, archive: A.NEWS.ARCHIVE, restore: A.NEWS.RESTORE },
    gallery: { publish: A.GALLERY.ALBUM_PUBLISH, unpublish: A.GALLERY.ALBUM_UNPUBLISH, archive: A.GALLERY.ALBUM_ARCHIVE, restore: A.GALLERY.ALBUM_RESTORE },
    contact: { archive: A.CONTACT.ARCHIVE, restore: A.CONTACT.RESTORE },
    donations: { verify: A.DONATIONS.VERIFY, reject: A.DONATIONS.REJECT },
    finance: { approve: A.FINANCE.APPROVE, reject: A.FINANCE.REJECT, void: A.FINANCE.VOID },
    documents: { 'submit-for-approval': A.DOCUMENTS.SUBMIT, approve: A.DOCUMENTS.APPROVE, reject: A.DOCUMENTS.REJECT, publish: A.DOCUMENTS.PUBLISH, unpublish: A.DOCUMENTS.UNPUBLISH, archive: A.DOCUMENTS.ARCHIVE, restore: A.DOCUMENTS.RESTORE },
  };
  if (module === 'gallery' && targetType === 'gallery-media') return operation === 'archive' ? A.GALLERY.MEDIA_ARCHIVE : A.GALLERY.MEDIA_RESTORE;
  return maps[module]?.[operation];
};

const responseTargetId = (body) => body?.data?._id || body?.data?.id || body?.admin?.id || body?.application?.id || body?.member?.id;
const safeChanges = (req, module, action, match) => {
  const safeBody = sanitizeAuditData(req.body || {});
  const changes = { fieldsChanged: Object.keys(safeBody) };
  if (action.endsWith('role-change')) changes.role = safeBody.role;
  if (action.endsWith('access-change')) changes.accessLevel = safeBody.accessLevel;
  if (action.endsWith('status-change')) changes.status = safeBody.status;
  if (action.endsWith('priority-change')) changes.priority = safeBody.priority;
  if (module === 'settings') { changes.section = match[1]; changes.fieldsChanged = Object.keys(safeBody); }
  return { ...changes, ...(sanitizeAuditData(req.res?.locals?.auditChanges || {})) };
};

const adminActivityAuditMiddleware = (req, res, next) => {
  if (!req.originalUrl.startsWith('/api/admin/')) return next();
  const path = req.originalUrl.split('?')[0];
  const rule = rules.find(([method, regex]) => method === req.method && regex.test(path));
  if (!rule) return next();
  const [method, regex, fixedAction, module, targetType] = rule;
  const match = path.match(regex);
  const operation = match?.at(-1);
  const action = fixedAction || dynamicAction(module, operation, targetType);
  if (!action) return next();
  const originalJson = res.json.bind(res);
  let handled = false;
  res.json = (body) => {
    if (handled || res.statusCode < 200 || res.statusCode >= 300 || body?.success === false || !req.admin) return originalJson(body);
    handled = true;
    const idFromPath = match?.slice(1).find((value) => /^[a-f\d]{24}$/i.test(value));
    const targetId = idFromPath || responseTargetId(body);
    const targetLabel = module === 'settings' ? match?.[1] : body?.data?.transactionId || body?.data?.memberId || body?.data?.slug;
    logAuditEvent({ admin: req.admin, action, module, target: { type: targetType, id: targetId, label: targetLabel }, changes: safeChanges(req, module, action, match), description: action, request: req })
      .catch((error) => console.error(`Audit logging failed: ${error.message}`))
      .finally(() => originalJson(body));
    return res;
  };
  return next();
};

module.exports = adminActivityAuditMiddleware;
