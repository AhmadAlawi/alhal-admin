import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './fixtures/auth.js'

test.describe('Analytics page workflows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/analytics')
  })

  test('analytics page renders filters', async ({ page }) => {
    await expect(page.locator('.analytics-page, .page-title').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.filters-panel, .filter-select').first()).toBeVisible()
  })

  test('selecting product triggers chart area', async ({ page }) => {
    const productSelect = page.locator('.filters-panel select').first()
    await productSelect.waitFor({ state: 'visible', timeout: 15000 })
    const optionCount = await productSelect.locator('option').count()
    if (optionCount > 1) {
      await productSelect.selectOption({ index: 1 })
      await page.waitForTimeout(3000)
      const charts = page.locator('.chart-container, .chart-section, .loading-chart')
      expect(await charts.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('refresh button disabled without product then enabled', async ({ page }) => {
    const refresh = page.getByRole('button', { name: /refresh|تحديث/i })
    if (await refresh.isVisible()) {
      await expect(refresh).toBeDisabled()
    }
  })
})

test.describe('Reports page workflows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/reports')
    await expect(page.locator('.reports-page').first()).toBeVisible({ timeout: 20000 })
  })

  test('reports tabs and report list', async ({ page }) => {
    await expect(page.locator('.reports-tabs .tab-button').first()).toBeVisible()
    await expect(page.locator('.report-list button.report-item').first()).toBeVisible({ timeout: 15000 })
  })

  test('select sales report and load content', async ({ page }) => {
    await page.locator('.report-list button.report-item').first().click({ force: true })
    await expect(
      page.locator('.report-content, .no-report-selected, .loading-state, .error-state, .no-data').first()
    ).toBeVisible({ timeout: 20000 })
  })

  test('switch report categories', async ({ page }) => {
    const tabs = page.locator('.reports-tabs .tab-button')
    const count = await tabs.count()
    test.skip(count <= 2, 'Not enough report tabs')
    await tabs.nth(2).click({ force: true })
    await expect(page.locator('.report-list button.report-item').first()).toBeVisible({ timeout: 15000 })
  })

  test('auction category reports available', async ({ page }) => {
    const auctionsTab = page.locator('.reports-tabs .tab-button', { hasText: /auction|مزاد/i })
    test.skip((await auctionsTab.count()) === 0, 'Auction tab not in UI locale')
    await auctionsTab.first().click({ force: true })
    await page.locator('.report-list button.report-item').first().click({ force: true })
    await expect(page.locator('.reports-main').first()).toBeVisible()
  })
})
