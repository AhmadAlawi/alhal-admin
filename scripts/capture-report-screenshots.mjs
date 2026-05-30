/**
 * Capture report screenshots with mocked API (E2E-style auth).
 * Run: node scripts/capture-report-screenshots.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'docs', 'reports-screenshots')

function makeMockJwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ sub: '1', userId: 1, roles: ['superadmin'] })).toString('base64url')
  return `${header}.${payload}.e2e-signature`
}

function mockPayloadForUrl(url) {
  if (/\/reports\//i.test(url)) {
    return {
      success: true,
      data: {
        series: [
          { period: '2026-05-01', revenue: 15000, quantity: 120, totalSales: 15000 },
          { period: '2026-05-15', revenue: 22000, quantity: 180, totalSales: 22000 },
          { period: '2026-05-28', revenue: 18500, quantity: 150, totalSales: 18500 },
        ],
        items: [
          { name: 'بندورة', revenue: 12000, quantity: 500 },
          { name: 'خيار', revenue: 8500, quantity: 320 },
          { name: 'بطاطا', revenue: 6200, quantity: 410 },
        ],
      },
      summary: { totalRevenue: 55500, totalQuantity: 950, totalTransactions: 42 },
    }
  }
  if (/\/products|categories|users|listings/i.test(url)) {
    return {
      success: true,
      data: [
        { productId: 1, nameAr: 'بندورة', nameEn: 'Tomato' },
        { productId: 2, nameAr: 'خيار', nameEn: 'Cucumber' },
        { categoryId: 1, nameAr: 'خضار', nameEn: 'Vegetables' },
      ],
    }
  }
  if (/\/MarketAnalysis|filters/i.test(url)) {
    return { success: true, data: { governorates: ['دمشق', 'حلب', 'حمص'] } }
  }
  if (/\/analytics\//i.test(url)) {
    return {
      success: true,
      data: {
        priceTrends: [{ date: '2026-05-01', avgPrice: 3000 }],
        salesVolume: [{ governorate: 'دمشق', volume: 500 }],
      },
    }
  }
  if (/\/builder\/schema/i.test(url)) {
    return {
      success: true,
      data: {
        tables: [
          { id: 'orders', label: 'Orders', columns: [{ id: 'id', label: 'ID', type: 'number' }] },
        ],
      },
    }
  }
  if (/\/builder\/saved/i.test(url)) {
    return { success: true, data: [] }
  }
  return { success: true, data: [] }
}

const CATEGORIES = [
  { id: 'sales', tabMatch: /مبيعات|sales/i, firstReport: 0 },
  { id: 'users', tabMatch: /مستخدم|users/i, firstReport: 0 },
  { id: 'products', tabMatch: /منتج|product/i, firstReport: 0 },
  { id: 'transport', tabMatch: /نقل|transport/i, firstReport: 0 },
  { id: 'financial', tabMatch: /مال|financial/i, firstReport: 0 },
]

async function setupPage(page) {
  const token = makeMockJwt()
  await page.addInitScript((jwt) => {
    localStorage.setItem('authToken', jwt)
    localStorage.setItem('user', JSON.stringify({ userId: 1, email: 'docs@test.local', roles: ['superadmin'] }))
    localStorage.setItem('userAccess', JSON.stringify({ roles: ['superadmin'], permissions: [], updatedAt: Date.now() }))
    sessionStorage.setItem('authLastCheck', String(Date.now()))
  }, token)

  await page.route('**/api/auth/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { userId: 1, email: 'docs@test.local', roles: ['superadmin'] } }),
    })
  })

  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/api/auth/')) return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPayloadForUrl(url)),
    })
  })
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await setupPage(page)

  const base = process.env.E2E_BASE_URL || 'http://localhost:3000'

  // Overview
  await page.goto(`${base}/reports`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('.reports-page', { timeout: 30000 })
  await page.screenshot({ path: path.join(OUT_DIR, '00-reports-overview.png'), fullPage: true })

  for (const cat of CATEGORIES) {
    const tab = page.locator('.reports-tabs .tab-button').filter({ hasText: cat.tabMatch })
    if ((await tab.count()) === 0) continue
    await tab.first().click({ force: true })
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT_DIR, `category-${cat.id}.png`), fullPage: true })

    const reportBtn = page.locator('.report-list button.report-item').nth(cat.firstReport)
    if ((await reportBtn.count()) > 0) {
      await reportBtn.click({ force: true })
      await page.waitForSelector('.report-content, .no-data, .error-state', { timeout: 15000 })
      await page.waitForTimeout(800)
      await page.screenshot({ path: path.join(OUT_DIR, `report-${cat.id}-sample.png`), fullPage: true })
    }
  }

  // Analytics
  await page.goto(`${base}/analytics`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('.analytics-page, .page-title', { timeout: 30000 })
  await page.screenshot({ path: path.join(OUT_DIR, 'analytics-page.png'), fullPage: true })

  // Report Builder
  await page.goto(`${base}/reports/builder`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('.report-builder-page, .page-title', { timeout: 30000 })
  await page.screenshot({ path: path.join(OUT_DIR, 'report-builder.png'), fullPage: true })

  // Saved Reports
  await page.goto(`${base}/reports/saved`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('.saved-reports-page, .page-title', { timeout: 30000 })
  await page.screenshot({ path: path.join(OUT_DIR, 'saved-reports.png'), fullPage: true })

  // Chat Reports
  await page.goto(`${base}/chat-reports`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('.chat-reports-page, .page-title', { timeout: 30000 }).catch(() => {})
  await page.screenshot({ path: path.join(OUT_DIR, 'chat-reports.png'), fullPage: true })

  await browser.close()
  console.log(`Screenshots saved to ${OUT_DIR}`)
  console.log(fs.readdirSync(OUT_DIR).join('\n'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
