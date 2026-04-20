import apiClient from './api'

const unwrapResponse = (response) => response?.data ?? response ?? []

const advertisementsService = {
  getAdvertisements: async (params = {}) => {
    const response = await apiClient.get('/api/admin/advertisements', params)
    return unwrapResponse(response)
  },

  getAdvertisementById: async (id) => {
    const response = await apiClient.get(`/api/admin/advertisements/${id}`)
    return unwrapResponse(response)
  },

  createAdvertisement: async (payload) => {
    const response = await apiClient.post('/api/admin/advertisements', payload)
    return unwrapResponse(response)
  },

  updateAdvertisement: async (id, payload) => {
    const response = await apiClient.put(`/api/admin/advertisements/${id}`, payload)
    return unwrapResponse(response)
  },

  deleteAdvertisement: async (id) => {
    const response = await apiClient.delete(`/api/admin/advertisements/${id}`)
    return unwrapResponse(response)
  },

  getAppAdvertisements: async (enabledOnly = true) => {
    const response = await apiClient.get('/api/advertisement/app', { enabledOnly })
    return unwrapResponse(response)
  },

  getMobileHeaderAds: async () => {
    const response = await apiClient.get('/api/advertisement/mobile/header')
    return unwrapResponse(response)
  },
}

export default advertisementsService
