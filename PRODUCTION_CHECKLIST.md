# Production Deployment Checklist

## Required configuration

- Set `NODE_ENV=production`.
- Set `PORT` to the platform-assigned or intended listening port.
- Set `CLIENT_URL` to the exact HTTPS frontend origin; never use `*` with credentialed CORS.
- Generate a unique, high-entropy `JWT_SECRET` of at least 32 characters and store it only in secret configuration.
- Set a deliberate `JWT_EXPIRES_IN` duration.
- Use a production MongoDB URI stored only in secret configuration.
- Use a least-privilege MongoDB user, TLS, restricted Network Access/IP ranges where deployment permits, and regular tested backups. Do not rely on `0.0.0.0/0` for production.
- Keep `.env` outside source control and verify the deployment platform does not print environment values.

## Initial deployment

- Install production dependencies from the lockfile (`npm ci --omit=dev`).
- Run `npm run test:db` from the deployment environment.
- Run `npm run seed:roles` to synchronize system permissions.
- Run `npm run seed:settings` to initialize safe singleton defaults without overwriting customized settings.
- Provide temporary `SUPER_ADMIN_*` secret variables only while running `npm run seed:admin`; remove them afterward.
- Confirm the initial Super Admin can log in and immediately replace any temporary seed password through an approved operational process when password-change support is available.
- Verify `/`, `/api/health`, `/api/settings/public`, and critical Admin endpoints.

## Transport and application security

- Terminate HTTPS at a trusted proxy/platform; production authentication cookies require HTTPS.
- Verify forwarded HTTPS/cookie behavior on the chosen platform before enabling any proxy trust configuration. The app does not blindly trust proxy headers.
- Confirm Helmet headers and the exact CORS origin in production responses.
- Verify global, login, contact, membership-application, and donation rate limits from the deployed network path.
- Restrict database and deployment control-plane access to authorized operators.
- Protect production logs; AuditLog IP/User-Agent data is private security metadata.
- Configure centralized runtime logging, uptime/error monitoring, and alerts. These are deployment concerns and are not provisioned by this repository.

## Data and operational readiness

- Define and test MongoDB backup and restore procedures.
- Define an organizational audit-log retention policy before adding any retention job; none is assumed automatically.
- Test Admin login, disabled-Admin denial, RBAC denial, Member creation, application approval, donation verification, Finance approval/void, document publication, settings changes, and audit visibility.
- Confirm the last-active-Super-Admin protections with the production role records.
- Review Website Settings before exposing contact or payment display information.
- Never enter PINs, OTPs, passwords, API tokens, merchant secrets, or bank-login credentials into Website Settings.

## File and media storage

- Logo, banner, gallery, news attachment, and document fields currently store metadata/references only.
- No binary upload pipeline or public local upload directory is implemented.
- Integrate authenticated object storage separately, with private-by-default objects, signed/authorized retrieval, malware scanning as appropriate, and lifecycle/backups.
- Do not expose private storage URLs through frontend code.

## Release verification

- Run `npm audit` and review findings without forcing breaking upgrades.
- Run all syntax/regression checks and `npm run test:db`.
- Start with `npm start`, verify startup waits for MongoDB, and test SIGTERM graceful shutdown.
- Confirm production errors do not expose stack traces or database/filesystem details.
- Confirm development-only `/api/admin/rbac-test/*` routes return 404 in production.
- Verify no real secrets or test data are present in the repository or deployment image.
