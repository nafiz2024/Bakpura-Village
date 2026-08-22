const PERMISSIONS = Object.freeze({
  MEMBERS: Object.freeze({
    VIEW: 'members.view',
    CREATE: 'members.create',
    EDIT: 'members.edit',
    ARCHIVE: 'members.archive',
    DELETE: 'members.delete',
    EXPORT: 'members.export',
  }),
  APPLICATIONS: Object.freeze({
    VIEW: 'applications.view',
    REVIEW: 'applications.review',
    APPROVE: 'applications.approve',
    REJECT: 'applications.reject',
  }),
  ACTIVITIES: Object.freeze({
    VIEW: 'activities.view',
    CREATE: 'activities.create',
    EDIT: 'activities.edit',
    PUBLISH: 'activities.publish',
    DELETE: 'activities.delete',
  }),
  NEWS: Object.freeze({
    VIEW: 'news.view',
    CREATE: 'news.create',
    EDIT: 'news.edit',
    PUBLISH: 'news.publish',
    DELETE: 'news.delete',
  }),
  GALLERY: Object.freeze({
    VIEW: 'gallery.view',
    UPLOAD: 'gallery.upload',
    EDIT: 'gallery.edit',
    DELETE: 'gallery.delete',
  }),
  CONTACT: Object.freeze({
    VIEW: 'contact.view',
    MANAGE: 'contact.manage',
  }),
  FINANCE: Object.freeze({
    VIEW: 'finance.view',
    CREATE: 'finance.create',
    EDIT: 'finance.edit',
    APPROVE: 'finance.approve',
    VOID: 'finance.void',
    EXPORT: 'finance.export',
  }),
  DOCUMENTS: Object.freeze({
    VIEW: 'documents.view',
    UPLOAD: 'documents.upload',
    EDIT: 'documents.edit',
    DOWNLOAD: 'documents.download',
    CHANGE_ACCESS: 'documents.changeAccess',
    APPROVE: 'documents.approve',
    DELETE: 'documents.delete',
  }),
  COMMITTEE: Object.freeze({
    VIEW: 'committee.view',
    MANAGE: 'committee.manage',
  }),
  ADMINS: Object.freeze({
    VIEW: 'admins.view',
    CREATE: 'admins.create',
    EDIT: 'admins.edit',
    DISABLE: 'admins.disable',
  }),
  ROLES: Object.freeze({
    VIEW: 'roles.view',
    MANAGE: 'roles.manage',
  }),
  SETTINGS: Object.freeze({
    VIEW: 'settings.view',
    MANAGE: 'settings.manage',
  }),
  AUDIT: Object.freeze({
    VIEW: 'audit.view',
    EXPORT: 'audit.export',
  }),
});

const ALL_PERMISSIONS = Object.freeze(Object.values(PERMISSIONS).flatMap(Object.values));

module.exports = { PERMISSIONS, ALL_PERMISSIONS };
