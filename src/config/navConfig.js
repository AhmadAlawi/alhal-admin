import { PERMISSIONS, canSeeNavItem } from '../utils/accessControl'

/**
 * Sidebar navigation — each item declares how access is checked.
 * @see backend RBAC spec for permission ↔ route mapping
 */
export const NAV_ITEMS = [
  {
    path: '/dashboard',
    labelKey: 'nav.govDashboard',
    permission: PERMISSIONS.GOV_DASHBOARD,
  },
  {
    path: '/reports/saved',
    labelKey: 'nav.savedReports',
    permission: PERMISSIONS.GOV_REPORTS_BUILD,
  },
  {
    path: '/reports/builder',
    labelKey: 'nav.reportBuilder',
    permission: PERMISSIONS.GOV_REPORTS_BUILD,
  },
  {
    path: '/reports',
    labelKey: 'nav.govReports',
    permission: PERMISSIONS.GOV_REPORTS,
  },
  {
    path: '/analytics',
    labelKey: 'nav.marketAnalysis',
    permission: PERMISSIONS.GOV_MARKET_ANALYSIS,
  },
  {
    path: '/gov/alerts',
    labelKey: 'nav.marketAlerts',
    permission: PERMISSIONS.GOV_ALERTS,
  },
  {
    path: '/gov/market-control',
    labelKey: 'nav.marketControl',
    permission: PERMISSIONS.GOV_MARKET_CONTROL,
  },
  {
    path: '/products',
    labelKey: 'nav.govProductPrices',
    permission: PERMISSIONS.GOV_PRODUCT_PRICES,
  },
  {
    path: '/transport/price-lines',
    labelKey: 'nav.govTransportPrices',
    permission: PERMISSIONS.GOV_TRANSPORT_PRICES,
  },
  {
    path: '/rbac',
    labelKey: 'nav.rbac',
    rbacAdmin: true,
  },
  { path: '/users', labelKey: 'common.users', legacyAdmin: true },
  { path: '/categories', labelKey: 'common.categories', legacyAdmin: true },
  { path: '/orders', labelKey: 'common.orders', legacyAdmin: true },
  { path: '/chat-reports', labelKey: 'common.chatReports', legacyAdmin: true },
  { path: '/tickets', labelKey: 'common.tickets', legacyAdmin: true },
  { path: '/feedback', labelKey: 'common.feedback', legacyAdmin: true },
  {
    path: '/transport/providers',
    labelKey: 'common.transportProviders',
    legacyAdmin: true,
  },
  {
    path: '/transport/vehicles',
    labelKey: 'common.transportVehicles',
    legacyAdmin: true,
  },
  {
    path: '/transport/requests',
    labelKey: 'common.transportRequests',
    legacyAdmin: true,
  },
  { path: '/ads', labelKey: 'common.ads', legacyAdmin: true },
  { path: '/mobile-analytics', labelKey: 'common.mobileAnalytics', legacyAdmin: true },
  { path: '/settings', labelKey: 'common.settings', legacyAdmin: true },
]

export function getVisibleNavItems(roles, permissions) {
  return NAV_ITEMS.filter((item) => canSeeNavItem(item, roles, permissions))
}

export function getDefaultRoute(roles, permissions) {
  const visible = getVisibleNavItems(roles, permissions)
  return visible[0]?.path || '/dashboard'
}
