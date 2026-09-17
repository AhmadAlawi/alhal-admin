import apiClient from './api'

function unwrapList(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data)) return res.data
  return []
}

function normalizeUnit(raw) {
  if (!raw || typeof raw !== 'object') return null
  const unitId = raw.unitId ?? raw.UnitId
  if (unitId == null) return null
  return {
    unitId,
    code: raw.code ?? raw.Code ?? '',
    nameAr: raw.nameAr ?? raw.NameAr ?? '',
    nameEn: raw.nameEn ?? raw.NameEn ?? '',
    unitType: raw.unitType ?? raw.UnitType ?? 'weight',
    factorToBase: Number(raw.factorToBase ?? raw.FactorToBase ?? 1),
    isBaseUnit: Boolean(raw.isBaseUnit ?? raw.IsBaseUnit),
    isActive: (raw.isActive ?? raw.IsActive) !== false,
    sortOrder: raw.sortOrder ?? raw.SortOrder ?? 0,
  }
}

export const unitsService = {
  /** GET /api/units — full list (active + inactive) for admin management. */
  async getAllForAdmin() {
    const res = await apiClient.get('/api/units', { isActive: null })
    return unwrapList(res).map(normalizeUnit).filter(Boolean)
  },

  /** Dropdown options for a given unit type, active only. */
  async getOptions({ unitType } = {}) {
    const params = { isActive: true }
    if (unitType) params.unitType = unitType
    const res = await apiClient.get('/api/units', params)
    return unwrapList(res).map(normalizeUnit).filter(Boolean)
  },

  /** POST /api/units */
  create: (payload) =>
    apiClient.post('/api/units', {
      code: payload.code,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      unitType: payload.unitType,
      factorToBase: Number(payload.factorToBase),
      isBaseUnit: Boolean(payload.isBaseUnit),
      sortOrder: Number(payload.sortOrder) || 0,
    }),

  /** PUT /api/units/{id} */
  update: (id, payload) =>
    apiClient.put(`/api/units/${id}`, {
      code: payload.code,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      unitType: payload.unitType,
      factorToBase: Number(payload.factorToBase),
      isBaseUnit: Boolean(payload.isBaseUnit),
      sortOrder: Number(payload.sortOrder) || 0,
      isActive: payload.isActive,
    }),

  /** DELETE /api/units/{id} */
  remove: (id) => apiClient.delete(`/api/units/${id}`),

  /** PATCH /api/units/{id}/toggle-active */
  toggleActive: (id) => apiClient.patch(`/api/units/${id}/toggle-active`),

  /** POST /api/units/convert */
  convert: (fromUnitCode, toUnitCode, quantity) =>
    apiClient.post('/api/units/convert', { fromUnitCode, toUnitCode, quantity }),
}

export default unitsService
