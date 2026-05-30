import apiClient from './api'
import {
  collectWidgetPermissions,
  DEFAULT_GLOBAL_FILTERS,
  generateId,
} from '../utils/customDashboardUtils'

const BASE = '/api/gov/dashboard/layouts'

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res
}

function normalizeGlobalFilters(filters) {
  if (!filters) return { ...DEFAULT_GLOBAL_FILTERS }
  return {
    days: filters.days ?? DEFAULT_GLOBAL_FILTERS.days,
    governorateId: filters.governorateId ?? null,
  }
}

function normalizeDashboard(raw, { readOnly = false, isShared = false } = {}) {
  if (!raw) return null
  return {
    ...raw,
    id: String(raw.id),
    readOnly: readOnly || raw.readOnly === true,
    isShared: isShared || raw.isShared === true,
    globalFilters: normalizeGlobalFilters(raw.globalFilters),
    widgets: Array.isArray(raw.widgets) ? raw.widgets : [],
    requiredPermissions: raw.requiredPermissions || collectWidgetPermissions(raw.widgets),
  }
}

export class ShareDashboardError extends Error {
  constructor(message, rejected = []) {
    super(message)
    this.name = 'ShareDashboardError'
    this.rejected = rejected
  }
}

export const customDashboardService = {
  async getPrimary() {
    const res = await apiClient.get(`${BASE}/primary`)
    const payload = unwrap(res)
    const dashboard = payload?.dashboard ?? payload
    if (!dashboard) return { dashboard: null, primaryId: payload?.primaryId ?? null }
    return {
      dashboard: normalizeDashboard(dashboard),
      primaryId: payload?.primaryId ? String(payload.primaryId) : String(dashboard.id),
    }
  },

  async listLayouts() {
    const res = await apiClient.get(BASE)
    const payload = unwrap(res)
    const owned = (payload?.owned || []).map((d) =>
      normalizeDashboard(d, { readOnly: false, isShared: false })
    )
    const shared = (payload?.shared || []).map((d) =>
      normalizeDashboard(d, { readOnly: true, isShared: true })
    )
    return {
      owned,
      shared,
      primaryId: payload?.primaryId ? String(payload.primaryId) : null,
    }
  },

  async listAccessibleDashboards(_userId, permissions, roles) {
    const { owned, shared } = await this.listLayouts()
    const all = [...owned, ...shared]
    return all.filter((d) => {
      if (!d.isShared) return true
      const required = d.requiredPermissions || []
      if (!required.length) return true
      return required.every(
        (p) =>
          permissions?.includes(p) ||
          roles?.includes('superadmin') ||
          roles?.includes('SuperAdmin')
      )
    })
  },

  async getDashboardById(id) {
    const res = await apiClient.get(`${BASE}/${id}`)
    const raw = unwrap(res)
    if (!raw) return null
    return normalizeDashboard(raw, {
      readOnly: raw.readOnly === true,
      isShared: raw.isShared === true,
    })
  },

  async createDashboard({ name, description, widgets = [], globalFilters }) {
    const res = await apiClient.post(BASE, {
      name,
      description: description || '',
      widgets,
      globalFilters: normalizeGlobalFilters(globalFilters),
    })
    return normalizeDashboard(unwrap(res))
  },

  async updateDashboard(id, patch) {
    const body = {}
    if (patch.name != null) body.name = patch.name
    if (patch.description != null) body.description = patch.description
    if (patch.widgets != null) body.widgets = patch.widgets
    if (patch.globalFilters != null) {
      body.globalFilters = normalizeGlobalFilters(patch.globalFilters)
    }
    const res = await apiClient.put(`${BASE}/${id}`, body)
    return normalizeDashboard(unwrap(res))
  },

  async deleteDashboard(id) {
    await apiClient.delete(`${BASE}/${id}`)
  },

  async setPrimaryDashboard(id) {
    await apiClient.put(`${BASE}/${id}/primary`, {})
    return id
  },

  async clearPrimaryDashboard() {
    const { primaryId } = await this.listLayouts()
    if (primaryId) {
      // If backend supports unset — otherwise no-op; primary cleared on delete server-side
    }
  },

  async shareDashboard(dashboardId, userIds) {
    try {
      const res = await apiClient.post(`${BASE}/${dashboardId}/share`, {
        userIds: userIds.map((id) => Number(id) || id),
      })
      return unwrap(res)
    } catch (err) {
      if (err.responseData?.rejected?.length) {
        throw new ShareDashboardError(err.message, err.responseData.rejected)
      }
      throw err
    }
  },

  async unshareDashboard(shareId) {
    await apiClient.delete(`${BASE}/shares/${shareId}`)
  },

  async duplicateDashboard(id) {
    const source = await this.getDashboardById(id)
    if (!source) throw new Error('Dashboard not found')
    return this.createDashboard({
      name: `${source.name} (نسخة)`,
      description: source.description,
      widgets: source.widgets.map((w) => ({ ...w, id: generateId() })),
      globalFilters: source.globalFilters,
    })
  },

  /** Load flow: primary first, then full list if needed */
  async resolvePrimaryDashboard() {
    const primaryRes = await this.getPrimary()
    if (primaryRes.dashboard) {
      return primaryRes.dashboard
    }
    const list = await this.listLayouts()
    if (list.primaryId) {
      const match = [...list.owned, ...list.shared].find(
        (d) => String(d.id) === String(list.primaryId)
      )
      if (match) return match
    }
    return null
  },
}

export default customDashboardService
