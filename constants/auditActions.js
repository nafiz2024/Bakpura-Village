const AUDIT_ACTIONS = Object.freeze({
  AUTH: Object.freeze({ LOGIN: 'auth.login', LOGOUT: 'auth.logout' }),
  ADMINS: Object.freeze({ CREATE: 'admins.create', UPDATE: 'admins.update', ROLE_CHANGE: 'admins.role-change', DISABLE: 'admins.disable', ENABLE: 'admins.enable' }),
  ROLES: Object.freeze({ CREATE: 'roles.create', UPDATE: 'roles.update', DEACTIVATE: 'roles.deactivate' }),
  MEMBERS: Object.freeze({ CREATE: 'members.create', UPDATE: 'members.update', STATUS_CHANGE: 'members.status-change', ARCHIVE: 'members.archive', RESTORE: 'members.restore' }),
  APPLICATIONS: Object.freeze({ REVIEW: 'applications.review', ASSIGN: 'applications.assign', REQUEST_INFO: 'applications.request-info', APPROVE: 'applications.approve', REJECT: 'applications.reject', ARCHIVE: 'applications.archive' }),
  COMMITTEE: Object.freeze({ CREATE: 'committee.create', UPDATE: 'committee.update', STATUS_CHANGE: 'committee.status-change', MEMBER_ADD: 'committee.member-add', MEMBER_UPDATE: 'committee.member-update', MEMBER_ARCHIVE: 'committee.member-archive', MEMBER_RESTORE: 'committee.member-restore', REORDER: 'committee.reorder' }),
  ACTIVITIES: Object.freeze({ CREATE: 'activities.create', UPDATE: 'activities.update', PUBLISH: 'activities.publish', UNPUBLISH: 'activities.unpublish', ARCHIVE: 'activities.archive', RESTORE: 'activities.restore', FEATURE_CHANGE: 'activities.feature-change' }),
  NEWS: Object.freeze({ CREATE: 'news.create', UPDATE: 'news.update', PUBLISH: 'news.publish', UNPUBLISH: 'news.unpublish', ARCHIVE: 'news.archive', RESTORE: 'news.restore', FLAG_CHANGE: 'news.flag-change' }),
  GALLERY: Object.freeze({ ALBUM_CREATE: 'gallery.album-create', ALBUM_UPDATE: 'gallery.album-update', ALBUM_PUBLISH: 'gallery.album-publish', ALBUM_UNPUBLISH: 'gallery.album-unpublish', ALBUM_ARCHIVE: 'gallery.album-archive', ALBUM_RESTORE: 'gallery.album-restore', MEDIA_ADD: 'gallery.media-add', MEDIA_UPDATE: 'gallery.media-update', MEDIA_STATUS: 'gallery.media-status', MEDIA_ARCHIVE: 'gallery.media-archive', MEDIA_RESTORE: 'gallery.media-restore', REORDER: 'gallery.reorder' }),
  CONTACT: Object.freeze({ READ: 'contact.read', STATUS_CHANGE: 'contact.status-change', PRIORITY_CHANGE: 'contact.priority-change', ASSIGN: 'contact.assign', NOTE_ADD: 'contact.note-add', ARCHIVE: 'contact.archive', RESTORE: 'contact.restore' }),
  DONATIONS: Object.freeze({ VERIFY: 'donations.verify', REJECT: 'donations.reject' }),
  FINANCE: Object.freeze({ CREATE: 'finance.transaction-create', UPDATE: 'finance.transaction-update', APPROVE: 'finance.approve', REJECT: 'finance.reject', VOID: 'finance.void' }),
  DOCUMENTS: Object.freeze({ CREATE: 'documents.create', UPDATE: 'documents.update', ACCESS_CHANGE: 'documents.access-change', VERSION_ADD: 'documents.version-add', SUBMIT: 'documents.submit', APPROVE: 'documents.approve', REJECT: 'documents.reject', PUBLISH: 'documents.publish', UNPUBLISH: 'documents.unpublish', ARCHIVE: 'documents.archive', RESTORE: 'documents.restore' }),
  SETTINGS: Object.freeze({ UPDATE: 'settings.update' }),
});

const ALL_AUDIT_ACTIONS = Object.freeze(Object.values(AUDIT_ACTIONS).flatMap(Object.values));
module.exports = { AUDIT_ACTIONS, ALL_AUDIT_ACTIONS };
