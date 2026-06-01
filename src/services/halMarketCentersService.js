import apiClient from './api'
import { cleanMapParams } from '../utils/govMapsUtils'

const BASE = '/api/gov/hal-market-centers'

function unwrapList(response) {
  const data = response?.data?.data ?? response?.data ?? response
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  return []
}

function unwrapItem(response) {
  return response?.data?.data ?? response?.data ?? response
}

export const halMarketCentersService = {
  list: async (params = {}) => {
    const res = await apiClient.get(BASE, cleanMapParams(params))
    return unwrapList(res)
  },

  create: async (payload) => {
    const res = await apiClient.post(BASE, payload)
    return unwrapItem(res)
  },

  update: async (id, payload) => {
    const res = await apiClient.put(`${BASE}/${id}`, payload)
    return unwrapItem(res)
  },

  remove: async (id) => apiClient.delete(`${BASE}/${id}`),
}

export default halMarketCentersService
