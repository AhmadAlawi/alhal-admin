export const PERMISSIONS = {
  RBAC_MANAGE: 'platform.rbac.manage',
  GOV_DASHBOARD: 'gov.dashboard.view',
  GOV_REPORTS: 'gov.reports.view',
  GOV_REPORTS_BUILD: 'gov.reports.build',
  GOV_MARKET_ANALYSIS: 'gov.market_analysis.view',
  GOV_ALERTS: 'gov.alerts.manage',
  GOV_MARKET_CONTROL: 'gov.market.control.view',
  GOV_PRODUCT_PRICES: 'gov.product_prices.manage',
  GOV_TRANSPORT_PRICES: 'gov.transport_prices.manage',
}

const norm = (s) => String(s || '').trim().toLowerCase()

export function hasRole(roles, name) {
  const target = norm(name)
  return (roles || []).some((r) => norm(r) === target)
}

export function hasPermission(perms, code) {
  const target = norm(code)
  return (perms || []).some((p) => norm(p) === target)
}

export function isSuperAdmin(roles) {
  return hasRole(roles, 'superadmin')
}

export function canAccessAdmin(perms, roles) {
  return isSuperAdmin(roles) || hasPermission(perms, PERMISSIONS.RBAC_MANAGE)
}

export function canAccessGov(perms, roles, code) {
  if (isSuperAdmin(roles)) return true
  return hasPermission(perms, code)
}

/** Legacy platform admin screens (until backend migrates). */
export function canAccessLegacyAdmin(roles) {
  return isSuperAdmin(roles) || hasRole(roles, 'admin')
}

export function canSeeNavItem(item, roles, perms) {
  if (isSuperAdmin(roles)) return true
  if (item.rbacAdmin) return canAccessAdmin(perms, roles)
  if (item.legacyAdmin) return canAccessLegacyAdmin(roles)
  if (item.permission) return canAccessGov(perms, roles, item.permission)
  return false
}
