# Bakpura Welfare API Routes

All responses are JSON. “Admin” means a valid active Admin session or Bearer token. Permission names are enforced by the backend.

## Public and authentication

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | API identity |
| GET | `/api/health` | Public | API, database, environment, and uptime health |
| POST | `/api/admin/auth/login` | Public, rate-limited | Admin login |
| GET | `/api/admin/auth/me` | Admin | Current Admin and effective permissions |
| POST | `/api/admin/auth/logout` | Admin | Logout and clear Admin cookie |
| POST | `/api/membership-applications` | Public, rate-limited | Submit membership application |
| GET | `/api/committees` | Public | Public committees |
| GET | `/api/committees/:slug` | Public | Public committee details |
| GET | `/api/activities` | Public | Published activities |
| GET | `/api/activities/featured` | Public | Featured published activities |
| GET | `/api/activities/:slug` | Public | Published activity details |
| GET | `/api/news` | Public | Published news/notices |
| GET | `/api/news/important` | Public | Important published items |
| GET | `/api/news/pinned` | Public | Pinned published items |
| GET | `/api/news/featured` | Public | Featured published items |
| GET | `/api/news/:slug` | Public | Published news details |
| GET | `/api/gallery/albums` | Public | Published albums |
| GET | `/api/gallery/albums/featured` | Public | Featured published albums |
| GET | `/api/gallery/albums/:slug` | Public | Published album and public media |
| GET | `/api/gallery/media` | Public | Active public media |
| GET | `/api/gallery/media/featured` | Public | Featured active public media |
| POST | `/api/contact` | Public, rate-limited | Submit contact message |
| POST | `/api/donations` | Public, rate-limited | Submit donation information; no payment processing |
| GET | `/api/documents` | Public | Published public documents |
| GET | `/api/documents/:slug` | Public | Published public document metadata |
| GET | `/api/settings/public` | Public | Explicitly serialized public settings |

## Members and applications

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/api/admin/members` | `members.view` | List/search/filter Members |
| POST | `/api/admin/members` | `members.create` | Create Member |
| GET | `/api/admin/members/stats` | `members.view` | Member statistics |
| GET | `/api/admin/members/:id` | `members.view` | Member details |
| PATCH | `/api/admin/members/:id` | `members.edit` | Update allowed Member fields |
| PATCH | `/api/admin/members/:id/status` | `members.edit` | Change active/inactive status |
| POST | `/api/admin/members/:id/archive` | `members.archive` | Soft archive Member |
| POST | `/api/admin/members/:id/restore` | `members.archive` | Restore Member |
| GET | `/api/admin/membership-applications` | `applications.view` | List applications |
| GET | `/api/admin/membership-applications/stats` | `applications.view` | Application statistics |
| GET | `/api/admin/membership-applications/:id` | `applications.view` | Application details |
| PATCH | `/api/admin/membership-applications/:id/review` | `applications.review` | Mark under review |
| PATCH | `/api/admin/membership-applications/:id/assign` | `applications.review` | Assign reviewer |
| PATCH | `/api/admin/membership-applications/:id/request-info` | `applications.review` | Request more information |
| POST | `/api/admin/membership-applications/:id/approve` | `applications.approve` | Approve and create Member transactionally |
| POST | `/api/admin/membership-applications/:id/reject` | `applications.reject` | Reject application |
| POST | `/api/admin/membership-applications/:id/archive` | `applications.review` | Archive application |

## Admin users and roles

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/api/admin/admin-users` | `admins.view` | List Admins |
| POST | `/api/admin/admin-users` | `admins.create` | Create Admin |
| GET | `/api/admin/admin-users/stats` | `admins.view` | Admin statistics |
| GET | `/api/admin/admin-users/:id` | `admins.view` | Admin details |
| PATCH | `/api/admin/admin-users/:id` | `admins.edit` | Update Admin profile |
| PATCH | `/api/admin/admin-users/:id/role` | `roles.manage` | Change Admin role |
| POST | `/api/admin/admin-users/:id/disable` | `admins.disable` | Disable Admin |
| POST | `/api/admin/admin-users/:id/enable` | `admins.disable` | Enable Admin |
| GET | `/api/admin/roles` | `roles.view` | List roles |
| POST | `/api/admin/roles` | `roles.manage` | Create custom role |
| GET | `/api/admin/roles/permissions` | `roles.view` | Permission catalog |
| GET | `/api/admin/roles/:id` | `roles.view` | Role details |
| PATCH | `/api/admin/roles/:id` | `roles.manage` | Update allowed role fields |

## Committee and content

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET/POST | `/api/admin/committees` | `committee.view` / `committee.manage` | List or create committees |
| GET | `/api/admin/committees/stats` | `committee.view` | Committee statistics |
| GET/PATCH | `/api/admin/committees/:id` | `committee.view` / `committee.manage` | Details or update |
| PATCH | `/api/admin/committees/:id/status` | `committee.manage` | Change status/public state workflow |
| GET/POST | `/api/admin/committees/:committeeId/members` | `committee.view` / `committee.manage` | List or add committee members |
| PATCH | `/api/admin/committees/:committeeId/members/:memberId` | `committee.manage` | Update committee member |
| POST | `/api/admin/committees/:committeeId/members/:memberId/archive` | `committee.manage` | Archive committee member |
| POST | `/api/admin/committees/:committeeId/members/:memberId/restore` | `committee.manage` | Restore committee member |
| PATCH | `/api/admin/committees/:committeeId/reorder` | `committee.manage` | Reorder committee members |
| GET/POST | `/api/admin/activities` | `activities.view` / `activities.create` | List or create activities |
| GET/PATCH | `/api/admin/activities/:id` | `activities.view` / `activities.edit` | Details or update |
| GET | `/api/admin/activities/stats` | `activities.view` | Activity statistics |
| POST | `/api/admin/activities/:id/publish` | `activities.publish` | Publish |
| POST | `/api/admin/activities/:id/unpublish` | `activities.publish` | Unpublish |
| PATCH | `/api/admin/activities/:id/featured` | `activities.edit` | Change featured flag |
| POST | `/api/admin/activities/:id/archive` | `activities.delete` | Soft archive |
| POST | `/api/admin/activities/:id/restore` | `activities.delete` | Restore to draft |
| GET/POST | `/api/admin/news` | `news.view` / `news.create` | List or create news/notices |
| GET/PATCH | `/api/admin/news/:id` | `news.view` / `news.edit` | Details or update |
| GET | `/api/admin/news/stats` | `news.view` | News statistics |
| POST | `/api/admin/news/:id/publish` | `news.publish` | Publish |
| POST | `/api/admin/news/:id/unpublish` | `news.publish` | Unpublish |
| PATCH | `/api/admin/news/:id/pinned` | `news.edit` | Change pinned flag |
| PATCH | `/api/admin/news/:id/flags` | `news.edit` | Change featured/important flags |
| POST | `/api/admin/news/:id/archive` | `news.delete` | Soft archive |
| POST | `/api/admin/news/:id/restore` | `news.delete` | Restore to draft |

## Gallery and contact

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET/POST | `/api/admin/gallery/albums` | `gallery.view` / `gallery.edit` | List or create albums |
| GET | `/api/admin/gallery/albums/stats` | `gallery.view` | Album statistics |
| GET/PATCH | `/api/admin/gallery/albums/:id` | `gallery.view` / `gallery.edit` | Album details or update |
| POST | `/api/admin/gallery/albums/:id/publish` | `gallery.edit` | Publish album |
| POST | `/api/admin/gallery/albums/:id/unpublish` | `gallery.edit` | Unpublish album |
| POST | `/api/admin/gallery/albums/:id/archive` | `gallery.delete` | Archive album |
| POST | `/api/admin/gallery/albums/:id/restore` | `gallery.delete` | Restore album |
| PATCH | `/api/admin/gallery/albums/:albumId/reorder` | `gallery.edit` | Reorder album media |
| GET/POST | `/api/admin/gallery/media` | `gallery.view` / `gallery.upload` | List or add media references |
| GET/PATCH | `/api/admin/gallery/media/:id` | `gallery.view` / `gallery.edit` | Media details or update |
| GET | `/api/admin/gallery/media/stats` | `gallery.view` | Media statistics |
| PATCH | `/api/admin/gallery/media/:id/status` | `gallery.edit` | Change media status |
| PATCH | `/api/admin/gallery/media/:id/flags` | `gallery.edit` | Change public/featured flags |
| POST | `/api/admin/gallery/media/:id/archive` | `gallery.delete` | Archive media |
| POST | `/api/admin/gallery/media/:id/restore` | `gallery.delete` | Restore media |
| GET | `/api/admin/contact-messages` | `contact.view` | List/search messages |
| GET | `/api/admin/contact-messages/stats` | `contact.view` | Message statistics |
| GET | `/api/admin/contact-messages/:id` | `contact.view` | Message details and internal notes |
| PATCH | `/api/admin/contact-messages/:id/read` | `contact.manage` | Mark read |
| PATCH | `/api/admin/contact-messages/:id/status` | `contact.manage` | Change workflow status |
| PATCH | `/api/admin/contact-messages/:id/priority` | `contact.manage` | Change priority |
| PATCH | `/api/admin/contact-messages/:id/assign` | `contact.manage` | Assign active Admin |
| POST | `/api/admin/contact-messages/:id/notes` | `contact.manage` | Add internal note |
| POST | `/api/admin/contact-messages/:id/archive` | `contact.manage` | Archive message |
| POST | `/api/admin/contact-messages/:id/restore` | `contact.manage` | Restore message |

## Donations and finance

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/api/admin/donations` | `finance.view` | List/search donations |
| GET | `/api/admin/donations/stats` | `finance.view` | Donation statistics by currency |
| GET | `/api/admin/donations/:id` | `finance.view` | Private donation details |
| POST | `/api/admin/donations/:id/verify` | `finance.approve` | Verify and create one approved ledger entry |
| POST | `/api/admin/donations/:id/reject` | `finance.approve` | Reject pending donation |
| GET | `/api/admin/finance/summary` | `finance.view` | Approved totals separated by currency |
| GET | `/api/admin/finance/stats` | `finance.view` | Finance dashboard statistics |
| GET | `/api/admin/finance/report` | `finance.view` | Filtered structured report |
| GET | `/api/admin/finance/export` | `finance.export` | Bounded JSON-ready export |
| GET/POST | `/api/admin/finance/transactions` | `finance.view` / `finance.create` | List or create ledger transactions |
| GET/PATCH | `/api/admin/finance/transactions/:id` | `finance.view` / `finance.edit` | Details or edit pending transaction |
| POST | `/api/admin/finance/transactions/:id/approve` | `finance.approve` | Approve pending transaction |
| POST | `/api/admin/finance/transactions/:id/reject` | `finance.approve` | Reject pending transaction |
| POST | `/api/admin/finance/transactions/:id/void` | `finance.void` | Void approved transaction |

## Documents, settings, and audit

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET/POST | `/api/admin/documents` | `documents.view` / `documents.upload` | Authorized list or metadata creation |
| GET | `/api/admin/documents/stats` | `documents.view` | Authorized-only statistics |
| GET/PATCH | `/api/admin/documents/:id` | `documents.view` / `documents.edit` | Details or metadata update |
| PATCH | `/api/admin/documents/:id/access` | `documents.changeAccess` | Resource-checked access change |
| GET/POST | `/api/admin/documents/:id/versions` | `documents.view` / `documents.edit` | Version history or new version |
| GET | `/api/admin/documents/:id/versions/:version` | `documents.view` | Specific version metadata |
| GET | `/api/admin/documents/:id/download` | `documents.download` | Authorize and return private file reference |
| POST | `/api/admin/documents/:id/submit-for-approval` | `documents.edit` | Submit draft |
| POST | `/api/admin/documents/:id/approve` | `documents.approve` | Approve pending document |
| POST | `/api/admin/documents/:id/reject` | `documents.approve` | Reject to draft |
| POST | `/api/admin/documents/:id/publish` | `documents.approve` | Publish approved public document |
| POST | `/api/admin/documents/:id/unpublish` | `documents.edit` | Unpublish |
| POST | `/api/admin/documents/:id/archive` | `documents.delete` | Soft archive |
| POST | `/api/admin/documents/:id/restore` | `documents.delete` | Restore to draft |
| GET | `/api/admin/settings` | `settings.view` | Role-filtered settings sections |
| GET | `/api/admin/settings/:section` | `settings.view` | Authorized section |
| PATCH | `/api/admin/settings/:section` | `settings.manage` | Section-authorized update |
| GET | `/api/admin/audit-logs` | `audit.view` | Search/filter audit history |
| GET | `/api/admin/audit-logs/stats` | `audit.view` | Audit statistics |
| GET | `/api/admin/audit-logs/export` | `audit.export` | Bounded JSON export |
| GET | `/api/admin/audit-logs/:id` | `audit.view` | Audit entry details |

Development-only RBAC test endpoints are mounted under `/api/admin/rbac-test` only when `NODE_ENV=development`.
