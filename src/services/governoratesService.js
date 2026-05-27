import apiClient from './api'

function unwrapList(response) {
  const data = response?.data?.data ?? response?.data ?? response
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.governorates)) return data.governorates
  if (Array.isArray(data?.items)) return data.items
  return []
}

export const governoratesService = {
  /** Preferred: MarketAnalysis filter list */
  getFromMarketFilters: async () => {
    try {
      const res = await apiClient.get('/api/MarketAnalysis/filters/governorates')
      return unwrapList(res)
    } catch {
      return []
    }
  },

  /** Fallback: general governorates API */
  getAll: async () => {
    try {
      const res = await apiClient.get('/api/governorates')
      return unwrapList(res)
    } catch {
      return []
    }
  },

  async getOptions() {
    let list = await this.getFromMarketFilters()
    if (!list.length) list = await this.getAll()
    return list.map((g) => {
      const nameAr = g.nameAr ?? g.name ?? g.governorate ?? g.label
      const nameEn = g.nameEn ?? nameAr
      return {
        id: g.governorateId ?? g.id ?? g.GovernorateId,
        name: nameAr,
        nameAr,
        nameEn,
      }
    }).filter((g) => g.id != null && g.name)
  },
}

export default governoratesService
