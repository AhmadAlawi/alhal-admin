import { TRANSPORT_API } from './transportApiPaths'
import {
  deleteWithFallback,
  getWithFallback,
  postWithFallback,
  putWithFallback,
  transportDirect,
} from './transportApiClient'

const transportService = {
  getProviders: async (params = {}) => {
    const { admin, public: pub } = TRANSPORT_API.providers
    return getWithFallback(admin, pub, params)
  },

  getProviderById: async (id) => {
    const paths = TRANSPORT_API.providerById(id)
    return getWithFallback(paths.admin, paths.public)
  },

  createProvider: async (providerData) => {
    const { admin, public: pub } = TRANSPORT_API.providers
    return postWithFallback(admin, pub, providerData)
  },

  getProvidersByArea: async (area) => {
    return getWithFallback(
      `/api/admin/transport/area/${encodeURIComponent(area)}`,
      `/api/transport/area/${encodeURIComponent(area)}`
    )
  },

  verifyProvider: async (id, isVerified) => {
    const paths = TRANSPORT_API.providerVerify(id)
    return putWithFallback(paths.admin, paths.public, isVerified)
  },

  getProviderVehicles: async (providerId) => {
    const paths = TRANSPORT_API.providerVehicles(providerId)
    return getWithFallback(paths.admin, paths.public)
  },

  addVehicle: async (providerId, vehicleData) => {
    const paths = TRANSPORT_API.providerVehicles(providerId)
    return postWithFallback(paths.admin, paths.public, vehicleData)
  },

  deleteVehicle: async (providerId, vehicleId) => {
    const paths = TRANSPORT_API.deleteVehicle(providerId, vehicleId)
    return deleteWithFallback(paths.admin, paths.public)
  },

  getPriceLines: async (providerId) => {
    const paths = TRANSPORT_API.priceLinesList(providerId)
    return getWithFallback(paths.admin, paths.public)
  },

  createPriceLine: async (priceLineData) => {
    return transportDirect.post(TRANSPORT_API.priceLines, priceLineData)
  },

  updatePriceLine: async (priceLineId, priceLineData) => {
    return transportDirect.put(TRANSPORT_API.priceLineById(priceLineId), priceLineData)
  },

  deletePriceLine: async (priceLineId) => {
    return transportDirect.delete(TRANSPORT_API.priceLineById(priceLineId))
  },

  getProvidersWithPriceLines: async () => {
    const { admin, public: pub } = TRANSPORT_API.withPriceLines
    return getWithFallback(admin, pub)
  },

  getProviderWithPriceLines: async (providerId) => {
    const paths = TRANSPORT_API.providerPriceLines(providerId)
    return getWithFallback(paths.admin, paths.public)
  },

  getTransportRequests: async (params = {}) => {
    const { admin, public: pub } = TRANSPORT_API.requests
    return getWithFallback(admin, pub, params)
  },

  getTransportRequestById: async (requestId) => {
    const paths = TRANSPORT_API.requestById(requestId)
    return getWithFallback(paths.admin, paths.public)
  },

  createTransportRequest: async (requestData) => {
    const { admin, public: pub } = TRANSPORT_API.requests
    return postWithFallback(admin, pub, requestData)
  },

  deleteTransportRequest: async (requestId) => {
    const paths = TRANSPORT_API.requestById(requestId)
    return deleteWithFallback(paths.admin, paths.public)
  },

  notifyTransporters: async (requestId) => {
    const paths = TRANSPORT_API.requestNotify(requestId)
    return postWithFallback(paths.admin, paths.public, {})
  },

  getOffers: async (requestId) => {
    const paths = TRANSPORT_API.requestOffers(requestId)
    return getWithFallback(paths.admin, paths.public)
  },

  submitOffer: async (offerData) => {
    return transportDirect.post(TRANSPORT_API.offers, offerData)
  },

  acceptOffer: async (offerId) => {
    return transportDirect.post(TRANSPORT_API.offerAccept(offerId), {})
  },

  getOfficialPrice: async (priceRequest) => {
    return transportDirect.post(TRANSPORT_API.officialPrice, priceRequest)
  },

  getCheapestPrice: async (fromRegion, toRegion) => {
    return transportDirect.post(TRANSPORT_API.cheapestPrice, { fromRegion, toRegion })
  },

  getRegions: async () => {
    return transportDirect.get(TRANSPORT_API.regions)
  },
}

export default transportService
