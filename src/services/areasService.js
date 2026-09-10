import apiClient from './api'
import {
  normalizeArea,
  sortByLocalizedName,
  unwrapLocationList,
} from '../utils/locationNormalize'

export { normalizeArea } from '../utils/locationNormalize'

const areasService = {
  /**
   * GET /api/areas?cityId=&governorateId=&isActive=true
   */
  async getAreas({ cityId, governorateId, isActive = true, language = 'ar' } = {}) {
    const params = {}
    if (isActive != null) params.isActive = isActive
    if (cityId != null && cityId !== '') params.cityId = cityId
    if (governorateId != null && governorateId !== '') {
      params.governorateId = governorateId
    }
    const response = await apiClient.get('/api/areas', params)
    const list = unwrapLocationList(response)
      .map((row) => normalizeArea(row, language))
      .filter(Boolean)
    return sortByLocalizedName(list, language)
  },

  async getAreasByCity(cityId, { governorateId, isActive = true, language = 'ar' } = {}) {
    if (cityId == null || cityId === '') return []
    return this.getAreas({ cityId, governorateId, isActive, language })
  },

  /** All areas of a city incl. inactive — for the admin table. */
  async getAllForAdmin(cityId, { language = 'ar' } = {}) {
    if (cityId == null || cityId === '') return []
    const response = await apiClient.get('/api/areas', { cityId, isActive: null })
    return sortByLocalizedName(
      unwrapLocationList(response).map((a) => normalizeArea(a, language)).filter(Boolean),
      language
    )
  },

  /** POST /api/areas */
  create: (payload) =>
    apiClient.post('/api/areas', {
      cityId: payload.cityId,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      description: payload.description ?? null,
    }),

  /** PUT /api/areas/{id} */
  update: (id, payload) =>
    apiClient.put(`/api/areas/${id}`, {
      cityId: payload.cityId,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      description: payload.description ?? null,
      isActive: payload.isActive,
    }),

  /** DELETE /api/areas/{id} */
  remove: (id) => apiClient.delete(`/api/areas/${id}`),

  /** PATCH /api/areas/{id}/toggle-active */
  toggleActive: (id) => apiClient.patch(`/api/areas/${id}/toggle-active`),
}

export default areasService
