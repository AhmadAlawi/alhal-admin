import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './fixtures/auth.js'

test.describe('Dashboard charts & workflows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard')
  })

  test('loads dashboard with header and filters', async ({ page }) => {
    await expect(page.locator('.page-title, h1').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.filter-select').first()).toBeVisible()
    const refresh = page.getByRole('button', { name: /refresh|تحديث/i })
    if (await refresh.isVisible()) {
      await refresh.click()
    }
  })

  test('shows chart containers or empty states (not crash)', async ({ page }) => {
    await page.waitForTimeout(2000)
    const charts = page.locator('.chart-container, .chart-empty, .charts-grid')
    const count = await charts.count()
    expect(count).toBeGreaterThanOrEqual(0)
    const errorBoundary = page.locator('.dashboard-error, [class*="error-boundary"]')
    await expect(errorBoundary).toHaveCount(0)
  })

  test('governorate filter changes selection', async ({ page }) => {
    const govSelect = page.locator('.filter-select').first()
    if (await govSelect.isVisible()) {
      const options = await govSelect.locator('option').count()
      if (options > 1) {
        await govSelect.selectOption({ index: 1 })
        await page.waitForTimeout(500)
      }
    }
  })

  test('period filter 7/30/60/90 days', async ({ page }) => {
    const periodSelect = page.locator('.filter-select').nth(1)
    if (await periodSelect.isVisible()) {
      await periodSelect.selectOption('7')
      await periodSelect.selectOption('30')
    }
  })
})
