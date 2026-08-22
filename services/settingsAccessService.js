const ALL_SECTIONS = Object.freeze(['general', 'organization', 'branding', 'contact', 'social', 'membership', 'donation', 'news', 'activities', 'gallery', 'homepage', 'announcement', 'maintenance', 'legal']);
const CONTENT_SECTIONS = Object.freeze(['news', 'activities', 'gallery', 'homepage', 'announcement']);

const readableSections = (admin) => {
  if (admin.role === 'super-admin' || admin.role === 'management-admin') return [...ALL_SECTIONS];
  if (admin.role === 'finance-admin') return ['donation'];
  if (admin.role === 'content-admin') return [...CONTENT_SECTIONS];
  return [];
};

const canManageSection = (admin, section) => {
  if (admin.role === 'super-admin' || admin.role === 'management-admin') return ALL_SECTIONS.includes(section);
  if (admin.role === 'finance-admin') return section === 'donation';
  if (admin.role === 'content-admin') return CONTENT_SECTIONS.includes(section);
  return false;
};

module.exports = { ALL_SECTIONS, CONTENT_SECTIONS, readableSections, canManageSection };
