import apiClient from './api'

function extractArray(response) {
  if (!response) return []
  if (Array.isArray(response)) return response
  if (response.status === 'success' && Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data)) return response.data
  return []
}

/** Normalize API city rows (field names vary by backend version). */
export function normalizeCity(raw) {
  if (!raw || typeof raw !== 'object') return null
  const cityId = raw.cityId ?? raw.id ?? raw.CityId
  if (cityId == null) return null
  const governorateId = raw.governorateId ?? raw.GovernorateId ?? raw.governorateID
  const name =
    raw.name ??
    raw.nameAr ??
    raw.nameEn ??
    raw.cityName ??
    (typeof raw.displayName === 'string' ? raw.displayName : null) ??
    `#${cityId}`
  return {
    cityId,
    name: String(name),
    governorateId: governorateId != null ? governorateId : undefined,
  }
}

const citiesService = {
  async getCities() {
    const response = await apiClient.get('/api/cities')
    return extractArray(response).map(normalizeCity).filter(Boolean)
  },

  async getCitiesByGovernorate(governorateId) {
    const response = await apiClient.get(`/api/cities/by-governorate/${encodeURIComponent(governorateId)}`)
    return extractArray(response).map(normalizeCity).filter(Boolean)
  },
}

export default citiesService
