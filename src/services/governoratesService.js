import apiClient from './api'
import {
  normalizeGovernorate,
  sortByLocalizedName,
  unwrapLocationList,
} from '../utils/locationNormalize'

function resolveOptionsArg(arg) {
  if (typeof arg === 'string') return { language: arg }
  if (arg && typeof arg === 'object') return arg
  return {}
}

export const governoratesService = {
  /** GET /api/governorates?isActive=true */
  getAll: async ({ isActive = true } = {}) => {
    try {
      const params = isActive != null ? { isActive } : {}
      const res = await apiClient.get('/api/governorates', params)
      return unwrapLocationList(res)
    } catch {
      return []
    }
  },

  /** Legacy fallback — MarketAnalysis filter list */
  getFromMarketFilters: async () => {
    try {
      const res = await apiClient.get('/api/MarketAnalysis/filters/governorates')
      return unwrapLocationList(res)
    } catch {
      return []
    }
  },

  /**
   * Dropdown options: `{ id, name, nameAr, nameEn }`
   * @param {string|{ language?: string, isActive?: boolean }} opts
   */
  async getOptions(opts) {
    const { language = 'ar', isActive = true } = resolveOptionsArg(opts)

    let list = await this.getAll({ isActive })
    if (!list.length) list = await this.getFromMarketFilters()

    return sortByLocalizedName(
      list.map((g) => normalizeGovernorate(g, language)).filter(Boolean),
      language
    )
  },

  /** Full list (active + inactive) for the admin management table. */
  async getAllForAdmin({ language = 'ar' } = {}) {
    const res = await apiClient.get('/api/governorates', { isActive: null })
    return sortByLocalizedName(
      unwrapLocationList(res).map((g) => normalizeGovernorate(g, language)).filter(Boolean),
      language
    )
  },

  /** POST /api/governorates */
  create: (payload) =>
    apiClient.post('/api/governorates', {
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      description: payload.description ?? null,
    }),

  /** PUT /api/governorates/{id} */
  update: (id, payload) =>
    apiClient.put(`/api/governorates/${id}`, {
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      description: payload.description ?? null,
      isActive: payload.isActive,
    }),

  /** DELETE /api/governorates/{id} */
  remove: (id) => apiClient.delete(`/api/governorates/${id}`),

  /** PATCH /api/governorates/{id}/toggle-active */
  toggleActive: (id) => apiClient.patch(`/api/governorates/${id}/toggle-active`),
}

export default governoratesService
