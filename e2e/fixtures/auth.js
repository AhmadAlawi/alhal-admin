/**
 * E2E auth: mock JWT with superadmin (default) or real login via env.
 * Set E2E_USE_REAL_AUTH=true, E2E_EMAIL, E2E_PASSWORD for real API login.
 */

function makeMockJwt(roles = ['superadmin'], permissions = []) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: '1',
      userId: 1,
      roles,
      permissions,
    })
  )
  return `${header}.${payload}.e2e-signature`
}

function mockPayloadForUrl(url) {
  if (/\/api\/(gov\/dashboard|MarketAnalysis)/i.test(url)) {
    return {
      success: true,
      data: {
        overview: { totalUsers: 0, openAuctions: 0, openTenders: 0, activeListings: 0 },
        marketAnalysis: {
          totalRevenue: { value: 0 },
          revenueSparkline: [{ date: '2026-05-01', value: 100 }],
        },
        priceTrends: [{ date: '2026-05-01', avgPrice: 3000 }],
        transactionsByType: [
          { type: 'direct', count: 5 },
          { type: 'auction', count: 3 },
        ],
      },
    }
  }
  if (/\/products|categories|users|listings/i.test(url)) {
    return { success: true, data: [] }
  }
  if (/\/reports\//i.test(url)) {
    return {
      success: true,
      data: [{ period: '2026-05-01', revenue: 1000, quantity: 50 }],
      summary: { totalRevenue: 1000, totalQuantity: 50 },
    }
  }
  if (/\/analytics\//i.test(url)) {
    return {
      success: true,
      data: {
        series: { auctions: [{ date: '2026-05-01', value: 1 }], tenders: [], orders: [] },
        bars: [{ label: 'Total', value: 10 }],
      },
    }
  }
  return { success: true, data: [] }
}

async function mockApiForE2E(page) {
  await page.route('**/api/auth/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { userId: 1, email: 'e2e@test.local', roles: ['superadmin'] },
      }),
    })
  })

  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/api/auth/')) return route.fallback()
    const body = mockPayloadForUrl(url)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

export async function loginAsAdmin(page) {
  const useReal = process.env.E2E_USE_REAL_AUTH === 'true'
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD

  if (useReal && email && password) {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in|login|دخول/i }).click()
    await page.waitForURL(/\/(dashboard|reports)/, { timeout: 30000 })
    return
  }

  const token = makeMockJwt(['superadmin'], [])

  await page.addInitScript((jwt) => {
    const mockUser = {
      userId: 1,
      email: 'e2e@test.local',
      roles: ['superadmin'],
      permissions: [],
    }
    localStorage.setItem('authToken', jwt)
    localStorage.setItem('user', JSON.stringify(mockUser))
    localStorage.setItem(
      'userAccess',
      JSON.stringify({ roles: ['superadmin'], permissions: [], updatedAt: Date.now() })
    )
    sessionStorage.setItem('authLastCheck', String(Date.now()))
  }, token)

  await mockApiForE2E(page)
}
