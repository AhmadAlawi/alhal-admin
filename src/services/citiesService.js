import apiClient from './api'
import {
  normalizeCity,
  sortByLocalizedName,
  unwrapLocationList,
} from '../utils/locationNormalize'

export { normalizeCity } from '../utils/locationNormalize'

const citiesService = {
  /**
   * GET /api/cities?governorateId=&isActive=true
   */
  async getCities({ governorateId, isActive = true, language = 'ar' } = {}) {
    const params = {}
    if (isActive != null) params.isActive = isActive
    if (governorateId != null && governorateId !== '') {
      params.governorateId = governorateId
    }
    const response = await apiClient.get('/api/cities', params)
    const list = unwrapLocationList(response)
      .map((row) => normalizeCity(row, language))
      .filter(Boolean)
    return sortByLocalizedName(list, language)
  },

  async getCitiesByGovernorate(governorateId, { isActive = true, language = 'ar' } = {}) {
    if (governorateId == null || governorateId === '') return []
    return this.getCities({ governorateId, isActive, language })
  },

  /** All cities of a governorate incl. inactive — for the admin table. */
  async getAllForAdmin(governorateId, { language = 'ar' } = {}) {
    if (governorateId == null || governorateId === '') return []
    const response = await apiClient.get('/api/cities', {
      governorateId,
      isActive: null,
    })
    return sortByLocalizedName(
      unwrapLocationList(response).map((c) => normalizeCity(c, language)).filter(Boolean),
      language
    )
  },

  /** POST /api/cities */
  create: (payload) =>
    apiClient.post('/api/cities', {
      governorateId: payload.governorateId,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      description: payload.description ?? null,
    }),

  /** PUT /api/cities/{id} */
  update: (id, payload) =>
    apiClient.put(`/api/cities/${id}`, {
      governorateId: payload.governorateId,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      description: payload.description ?? null,
      isActive: payload.isActive,
    }),

  /** DELETE /api/cities/{id} */
  remove: (id) => apiClient.delete(`/api/cities/${id}`),

  /** PATCH /api/cities/{id}/toggle-active */
  toggleActive: (id) => apiClient.patch(`/api/cities/${id}/toggle-active`),
}

export default citiesService
