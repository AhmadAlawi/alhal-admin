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
}

export default areasService
