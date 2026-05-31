import apiClient from './api'

const BASE = '/api/gov/analytics'

function cleanParams(params = {}) {
  const out = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') out[key] = value
  })
  return out
}

export const govAnalyticsService = {
  getEntities: () => apiClient.get(`${BASE}/entities`),

  getCatalog: (params = {}) => apiClient.get(`${BASE}/catalog`, cleanParams(params)),

  getReport: (reportId, filters = {}) =>
    apiClient.get(`${BASE}/reports/${reportId}`, cleanParams(filters)),

  batchReports: (reportIds, filters = {}) =>
    apiClient.post(`${BASE}/reports/batch`, {
      reportIds,
      filters: cleanParams(filters),
    }),
}

export default govAnalyticsService
