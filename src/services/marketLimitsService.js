import apiClient from './api'

function unwrapList(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data)) return res.data
  return []
}

function normalizeLimit(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    marketLimitId: raw.marketLimitId ?? raw.MarketLimitId,
    contextType: raw.contextType ?? raw.ContextType ?? '',
    minPrice: raw.minPrice ?? raw.MinPrice ?? null,
    maxPrice: raw.maxPrice ?? raw.MaxPrice ?? null,
    minQuantity: raw.minQuantity ?? raw.MinQuantity ?? null,
    maxQuantity: raw.maxQuantity ?? raw.MaxQuantity ?? null,
    isActive: (raw.isActive ?? raw.IsActive) !== false,
  }
}

export const marketLimitsService = {
  /** GET /api/market-limits */
  async getAll() {
    const res = await apiClient.get('/api/market-limits')
    return unwrapList(res).map(normalizeLimit).filter(Boolean)
  },

  /** PUT /api/market-limits — one row per contextType, created or replaced. */
  upsert: (payload) =>
    apiClient.put('/api/market-limits', {
      contextType: payload.contextType,
      minPrice: payload.minPrice === '' ? null : payload.minPrice,
      maxPrice: payload.maxPrice === '' ? null : payload.maxPrice,
      minQuantity: payload.minQuantity === '' ? null : payload.minQuantity,
      maxQuantity: payload.maxQuantity === '' ? null : payload.maxQuantity,
      isActive: payload.isActive,
    }),
}

export default marketLimitsService
