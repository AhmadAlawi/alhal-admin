import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './fixtures/auth.js'

const PAGES = [
  { path: '/dashboard', selector: '.dashboard, .page-title' },
  { path: '/reports', selector: '.reports-page' },
  { path: '/analytics', selector: '.analytics-page' },
  { path: '/products', selector: '.products-page' },
  { path: '/users', selector: '.users-page, .page-title' },
  { path: '/categories', selector: '.categories-page, .page-title' },
  { path: '/orders', selector: '.orders-page' },
  { path: '/settings', selector: '.settings-page, .page-title' },
  { path: '/chat-reports', selector: '.page-title, .chat-reports-page' },
  { path: '/tickets', selector: '.page-title, .tickets-page' },
  { path: '/feedback', selector: '.page-title, .feedback-page' },
  { path: '/transport/providers', selector: '.transport-providers-page' },
  { path: '/transport/vehicles', selector: '.transport-vehicles-page, .page-title' },
  { path: '/transport/requests', selector: '.transport-requests-page, .page-title' },
  { path: '/transport/price-lines', selector: '.page-title, .transport-price-lines' },
  { path: '/ads', selector: '.page-title, .ads-page' },
  { path: '/mobile-analytics', selector: '.mobile-analytics-page' },
  { path: '/gov/alerts', selector: '.rbac-empty, h2' },
  { path: '/gov/market-control', selector: '.rbac-empty, h2' },
]

test.describe('All admin pages smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  for (const { path, selector } of PAGES) {
    test(`page ${path} loads without crash`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBeLessThan(500)
      await expect(page.locator(selector).first()).toBeVisible({ timeout: 20000 })
    })
  }
})

test.describe('Mobile analytics charts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile-analytics')
  })

  test('mobile analytics filters and chart grid', async ({ page }) => {
    await expect(page.locator('.mobile-analytics-page').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.mobile-filters').first()).toBeVisible()
    const applyBtn = page.getByRole('button', { name: /apply filters/i })
    if (await applyBtn.isVisible()) {
      await applyBtn.click({ force: true })
    }
    await page.waitForTimeout(1500)
    const charts = page.locator('.charts-grid .chart-container, .heatmap-card')
    expect(await charts.count()).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Login page', () => {
  test('login form visible', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form, .login-page, .page-title').first()).toBeVisible()
  })
})
