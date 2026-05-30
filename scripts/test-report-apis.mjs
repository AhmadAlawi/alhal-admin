/**
 * Test all report API endpoints and output status summary.
 * Usage: node scripts/test-report-apis.mjs [token]
 * If no token, tries login with E2E_EMAIL/E2E_PASSWORD env vars.
 */

const API_BASE = process.env.VITE_API_BASE_URL || 'https://alhal.awnak.net';

const ENDPOINTS = [
  // Sales
  '/api/reports/sales',
  '/api/reports/sales/by-product',
  '/api/reports/sales/by-category',
  '/api/reports/sales/by-location',
  '/api/reports/sales/trends',
  // Users
  '/api/reports/users/activity',
  '/api/reports/users/registrations',
  '/api/reports/users/by-type',
  '/api/reports/users/by-location',
  '/api/reports/users/performance',
  // Products
  '/api/reports/products/performance',
  '/api/reports/products/inventory',
  '/api/reports/products/price-trends',
  '/api/reports/products/top',
  '/api/reports/products/by-category',
  // Transport
  '/api/reports/transport/activity',
  '/api/reports/transport/providers',
  '/api/reports/transport/routes',
  '/api/reports/transport/revenue',
  '/api/reports/transport/ratings',
  // Tenders
  '/api/reports/tenders/activity',
  '/api/reports/tenders/performance',
  '/api/reports/tenders/offers',
  '/api/reports/tenders/awards',
  // Auctions
  '/api/reports/auctions/activity',
  '/api/reports/auctions/bids',
  '/api/reports/auctions/revenue',
  // Financial
  '/api/reports/financial/revenue',
  '/api/reports/financial/payment-methods',
  '/api/reports/financial/transactions',
  '/api/reports/financial/profit-loss',
  // Inventory
  '/api/reports/inventory/levels',
  '/api/reports/inventory/movements',
  '/api/reports/inventory/stock-balance',
  '/api/reports/inventory/warehouses',
  // Performance
  '/api/reports/performance/system',
  '/api/reports/performance/conversion',
  '/api/reports/performance/retention',
  // Market
  '/api/reports/market/trends',
  '/api/reports/market/price-comparison',
  '/api/reports/market/supply-demand',
  // Losses
  '/api/reports/losses',
  '/api/reports/losses/by-product',
  '/api/reports/losses/by-location',
  // Legacy ministry
  '/api/reports/ministry/market-flow/monthly',
  '/api/reports/ministry/storage-capacity/by-governorate',
  '/api/reports/ministry/market-flow/current-month',
  '/api/reports/ministry/storage/usage-rate',
  '/api/reports/ministry/storage/total-capacity',
  '/api/reports/ministry/storage/types-distribution',
  // Legacy statistics
  '/api/reports/statistics/users/by-age-group',
  '/api/reports/statistics/users/by-type',
  '/api/reports/statistics/users/by-governorate',
  '/api/reports/statistics/production/by-product',
  '/api/reports/statistics/products/by-category',
  '/api/reports/statistics/production/seasonal',
  // Report builder
  '/api/reports/builder/schema',
  '/api/reports/builder/saved',
];

async function getToken() {
  if (process.argv[2]) return process.argv[2];
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) return null;
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data?.data?.token || data?.token || data?.data?.accessToken || null;
}

async function testEndpoint(token, endpoint) {
  const headers = { accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}?timeGroup=day&pageSize=10`, { headers });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { _raw: text.slice(0, 200) };
    }
    const hasData = body?.data !== undefined || body?.summary !== undefined || Array.isArray(body);
    return {
      endpoint,
      status: res.status,
      ok: res.ok,
      hasData,
      message: body?.message || body?.error || body?.title || null,
      dataPreview: hasData ? JSON.stringify(body.data ?? body).slice(0, 120) : null,
    };
  } catch (err) {
    return { endpoint, status: 0, ok: false, hasData: false, message: err.message };
  }
}

const token = await getToken();
console.log(`API: ${API_BASE}`);
console.log(`Auth: ${token ? 'yes' : 'no (401 expected)'}\n`);

const results = [];
for (const ep of ENDPOINTS) {
  results.push(await testEndpoint(token, ep));
}

const failed = results.filter((r) => !r.ok);
const empty = results.filter((r) => r.ok && !r.hasData);
const success = results.filter((r) => r.ok && r.hasData);

console.log('=== SUMMARY ===');
console.log(`Total: ${results.length} | OK with data: ${success.length} | OK empty: ${empty.length} | Failed: ${failed.length}\n`);

if (failed.length) {
  console.log('=== FAILED ENDPOINTS ===');
  for (const r of failed) {
    console.log(`${r.status} ${r.endpoint} — ${r.message || 'no message'}`);
  }
  console.log('');
}

if (empty.length) {
  console.log('=== OK BUT NO DATA FIELD ===');
  for (const r of empty) {
    console.log(`${r.status} ${r.endpoint}`);
  }
}

console.log('\n=== JSON ===');
console.log(JSON.stringify({ summary: { total: results.length, success: success.length, empty: empty.length, failed: failed.length }, results }, null, 2));
