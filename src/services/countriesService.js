import apiClient from './api'
import { normalizeCountry, sortByLocalizedName, unwrapLocationList } from '../utils/locationNormalize'

export const countriesService = {
  /** GET /api/countries?isActive=true */
  getAll: async ({ isActive = true } = {}) => {
    try {
      const params = isActive != null ? { isActive } : {}
      const res = await apiClient.get('/api/countries', params)
      return unwrapLocationList(res)
    } catch {
      return []
    }
  },

  /** Full list (active + inactive) for the admin management table. */
  async getAllForAdmin({ language = 'ar' } = {}) {
    const res = await apiClient.get('/api/countries', { isActive: null })
    return sortByLocalizedName(
      unwrapLocationList(res).map((c) => normalizeCountry(c, language)).filter(Boolean),
      language
    )
  },

  /** Dropdown options: `{ id, name, nameAr, nameEn, phoneCode, flagEmoji }` */
  async getOptions({ language = 'ar', isActive = true } = {}) {
    const list = await this.getAll({ isActive })
    return sortByLocalizedName(
      list.map((c) => normalizeCountry(c, language)).filter(Boolean),
      language
    )
  },

  /** POST /api/countries */
  create: (payload) =>
    apiClient.post('/api/countries', {
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      isoCode2: payload.isoCode2,
      phoneCode: payload.phoneCode,
      flagEmoji: payload.flagEmoji ?? null,
      sortOrder: payload.sortOrder ?? 0,
    }),

  /** PUT /api/countries/{id} */
  update: (id, payload) =>
    apiClient.put(`/api/countries/${id}`, {
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      isoCode2: payload.isoCode2,
      phoneCode: payload.phoneCode,
      flagEmoji: payload.flagEmoji ?? null,
      sortOrder: payload.sortOrder,
      isActive: payload.isActive,
    }),

  /** DELETE /api/countries/{id} */
  remove: (id) => apiClient.delete(`/api/countries/${id}`),

  /** PATCH /api/countries/{id}/toggle-active */
  toggleActive: (id) => apiClient.patch(`/api/countries/${id}/toggle-active`),
}

export default countriesService
