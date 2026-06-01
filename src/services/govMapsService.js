import apiClient from './api'
import { buildMapQuery } from '../utils/govMapsUtils'

const BASE = '/api/gov/maps'

export const govMapsService = {
  getFarmsMap: (filters = {}, options = {}) =>
    apiClient.get(`${BASE}/farms`, buildMapQuery(filters, options)),

  getProductsMap: (filters = {}, options = {}) =>
    apiClient.get(`${BASE}/products`, buildMapQuery(filters, options)),
}

export default govMapsService
