import { canAccessGov, isSuperAdmin } from './accessControl'

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `cd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getNestedValue(obj, path) {
  if (!obj || !path) return undefined
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj)
}

export function safeNum(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function collectWidgetPermissions(widgets) {
  const perms = new Set()
  ;(widgets || []).forEach((w) => {
    if (w.permission) perms.add(w.permission)
  })
  return [...perms]
}

export function canAccessDashboard(dashboard, permissions, roles) {
  if (!dashboard) return false
  if (dashboard.ownerId && dashboard.readOnly) {
    const required = dashboard.requiredPermissions || []
    return required.every((p) => canAccessGov(permissions, roles, p))
  }
  return true
}

export function userHasWidgetPermission(permission, permissions, roles) {
  if (!permission) return true
  return canAccessGov(permissions, roles, permission)
}

export function filterWidgetsByPermission(widgets, permissions, roles) {
  if (isSuperAdmin(roles)) return widgets || []
  return (widgets || []).filter((w) => userHasWidgetPermission(w.permission, permissions, roles))
}

export function createWidgetFromCatalog(catalogItem, overrides = {}) {
  return {
    id: generateId(),
    type: catalogItem.type,
    permission: catalogItem.permission,
    labelKey: catalogItem.labelKey,
    title: catalogItem.title || null,
    config: { ...catalogItem.config },
    layout: { colSpan: 6, rowSpan: 2, ...catalogItem.defaultLayout, ...overrides.layout },
  }
}

export function createPredefinedReportWidget(reportMeta) {
  return {
    id: generateId(),
    type: 'predefined-report',
    permission: reportMeta.permission,
    labelKey: reportMeta.labelKey,
    config: {
      categoryId: reportMeta.categoryId,
      reportId: reportMeta.reportId,
      endpoint: reportMeta.endpoint,
    },
    layout: { colSpan: 6, rowSpan: 2 },
  }
}

export function createSavedReportWidget(savedReport) {
  return {
    id: generateId(),
    type: 'saved-report',
    permission: 'gov.reports.build',
    title: savedReport.name,
    config: {
      savedReportId: savedReport.id,
      savedReportName: savedReport.name,
    },
    layout: { colSpan: 6, rowSpan: 2 },
  }
}

export const DEFAULT_GLOBAL_FILTERS = {
  days: 30,
  governorateId: null,
}

/** Map layout.globalFilters → query params for report/dashboard APIs */
export function globalFiltersToQueryParams(globalFilters = {}) {
  const params = {}
  const governorateId = globalFilters?.governorateId
  const days = globalFilters?.days

  if (governorateId != null && governorateId !== '') {
    params.governorateId = Number(governorateId)
  }

  if (days > 0) {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    params.startDate = start.toISOString().slice(0, 10)
    params.endDate = end.toISOString().slice(0, 10)
  }

  return params
}
