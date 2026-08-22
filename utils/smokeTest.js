const baseUrl = (process.env.API_BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');

const checks = [
  { path: '/', status: 200 },
  { path: '/api/health', status: 200 },
  { path: '/api/settings/public', status: 200 },
  { path: '/api/admin/members', status: 401 },
];

(async () => {
  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`);
    const body = await response.json();
    if (response.status !== check.status || typeof body.success !== 'boolean') {
      throw new Error(`${check.path} returned ${response.status}; expected ${check.status}`);
    }
    console.log(`Smoke check passed: ${check.path} -> ${response.status}`);
  }
})().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
