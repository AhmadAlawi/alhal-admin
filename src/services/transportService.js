import apiClient from './api'

const transportService = {
  // Transport Provider Management
  getProviders: async (params = {}) => {
    return apiClient.get('/api/transport', params)
  },

  getProviderById: async (id) => {
    return apiClient.get(`/api/transport/${id}`)
  },

  getProvidersByArea: async (area) => {
    return apiClient.get(`/api/transport/area/${encodeURIComponent(area)}`)
  },

  verifyProvider: async (id, isVerified) => {
    return apiClient.put(`/api/transport/${id}/verify`, isVerified)
  },

  // Vehicle Management
  getProviderVehicles: async (providerId) => {
    return apiClient.get(`/api/transport/${providerId}/vehicles`)
  },

  addVehicle: async (providerId, vehicleData) => {
    return apiClient.post(`/api/transport/${providerId}/vehicles`, vehicleData)
  },

  deleteVehicle: async (providerId, vehicleId) => {
    return apiClient.delete(`/api/transport/${providerId}/vehicle/${vehicleId}`)
  },

  // Price Lines Management
  getPriceLines: async (providerId) => {
    return apiClient.get(`/api/transport/${providerId}/price-lines/list`)
  },

  createPriceLine: async (priceLineData) => {
    return apiClient.post('/api/transport/price-lines', priceLineData)
  },

  updatePriceLine: async (priceLineId, priceLineData) => {
    return apiClient.put(`/api/transport/price-lines/${priceLineId}`, priceLineData)
  },

  deletePriceLine: async (priceLineId) => {
    return apiClient.delete(`/api/transport/price-lines/${priceLineId}`)
  },

  getProvidersWithPriceLines: async () => {
    return apiClient.get('/api/transport/with-price-lines')
  },

  getProviderWithPriceLines: async (providerId) => {
    return apiClient.get(`/api/transport/${providerId}/price-lines`)
  },

  // Transport Requests Management
  getTransportRequests: async (params = {}) => {
    return apiClient.get('/api/transport/requests', params)
  },

  getTransportRequestById: async (requestId) => {
    return apiClient.get(`/api/transport/requests/${requestId}`)
  },

  deleteTransportRequest: async (requestId) => {
    return apiClient.delete(`/api/transport/requests/${requestId}`)
  },

  notifyTransporters: async (requestId) => {
    return apiClient.post(`/api/transport/requests/${requestId}/notify`)
  },

  // Transport Offers Management
  getOffers: async (requestId) => {
    return apiClient.get(`/api/transport/requests/${requestId}/offers`)
  },

  submitOffer: async (offerData) => {
    return apiClient.post('/api/transport/offers', offerData)
  },

  acceptOffer: async (offerId) => {
    return apiClient.post(`/api/transport/offers/${offerId}/accept`)
  },

  // Transport Pricing
  getOfficialPrice: async (priceRequest) => {
    return apiClient.post('/api/transport-prices/official', priceRequest)
  },

  getCheapestPrice: async (fromRegion, toRegion) => {
    return apiClient.post('/api/transport-prices/cheapest', { fromRegion, toRegion })
  },

  getRegions: async () => {
    return apiClient.get('/api/transport-prices/regions')
  }
}

export default transportService
