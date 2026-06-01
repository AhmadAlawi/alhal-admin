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
}

export default governoratesService
