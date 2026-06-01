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
}

export default citiesService
