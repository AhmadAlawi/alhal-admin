import apiClient from './api'

const unwrapResponse = (response) => response?.data ?? response ?? []

function buildPublicAdParams({ enabledOnly, productCategoryId } = {}) {
  const params = {}
  if (enabledOnly != null) params.enabledOnly = enabledOnly
  if (productCategoryId != null && productCategoryId !== '') {
    params.productCategoryId = Number(productCategoryId)
  }
  return params
}

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

  /** GET /api/advertisement/app — optional productCategoryId (omit = all + global ads) */
  getAppAdvertisements: async (options = true) => {
    const opts =
      typeof options === 'boolean' ? { enabledOnly: options } : { enabledOnly: true, ...options }
    const response = await apiClient.get('/api/advertisement/app', buildPublicAdParams(opts))
    return unwrapResponse(response)
  },

  /** GET /api/advertisement/app/bottom */
  getAppBottomAdvertisements: async (productCategoryId) => {
    const response = await apiClient.get(
      '/api/advertisement/app/bottom',
      buildPublicAdParams({ productCategoryId })
    )
    return unwrapResponse(response)
  },

  /** GET /api/advertisement/mobile/header */
  getMobileHeaderAds: async (productCategoryId) => {
    const response = await apiClient.get(
      '/api/advertisement/mobile/header',
      buildPublicAdParams({ productCategoryId })
    )
    return unwrapResponse(response)
  },
}

export default advertisementsService
