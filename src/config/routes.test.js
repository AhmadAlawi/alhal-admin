import { describe, it, expect } from 'vitest'
import { NAV_ITEMS, getDefaultRoute } from './navConfig'
import { PERMISSIONS } from '../utils/accessControl'

/** All authenticated admin routes (matches App.jsx). */
export const ADMIN_ROUTES = [
  '/dashboard',
  '/reports',
  '/analytics',
  '/gov/alerts',
  '/gov/market-control',
  '/products',
  '/transport/price-lines',
  '/rbac/permissions',
  '/rbac/roles',
  '/rbac/users',
  '/users',
  '/categories',
  '/orders',
  '/chat-reports',
  '/tickets',
  '/feedback',
  '/transport/providers',
  '/transport/vehicles',
  '/transport/requests',
  '/ads',
  '/mobile-analytics',
  '/settings',
  '/login',
]

describe('admin routes & nav', () => {
  it('nav config paths are unique', () => {
    const paths = NAV_ITEMS.map((n) => n.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('covers all primary gov routes', () => {
    const navPaths = NAV_ITEMS.map((n) => n.path)
    expect(navPaths).toContain('/dashboard')
    expect(navPaths).toContain('/reports')
    expect(navPaths).toContain('/analytics')
    expect(navPaths).toContain('/products')
  })

  it('getDefaultRoute prefers dashboard for gov permissions', () => {
    const route = getDefaultRoute(['gov_admin'], [PERMISSIONS.GOV_DASHBOARD])
    expect(route).toBe('/dashboard')
  })

  it('ADMIN_ROUTES includes chart-heavy pages', () => {
    expect(ADMIN_ROUTES).toContain('/dashboard')
    expect(ADMIN_ROUTES).toContain('/analytics')
    expect(ADMIN_ROUTES).toContain('/reports')
    expect(ADMIN_ROUTES).toContain('/mobile-analytics')
  })
})
