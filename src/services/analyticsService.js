import apiClient from './api'

const toIsoOrNull = (value) => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const cleanEventMetadata = (metadata) => {
  if (metadata === null || metadata === undefined) return undefined
  if (typeof metadata === 'object' && !Array.isArray(metadata)) return metadata
  return undefined
}

export const analyticsService = {
  getLineChart: async (params = {}) => {
    const query = {}
    const from = toIsoOrNull(params.from)
    const to = toIsoOrNull(params.to)
    if (from) query.from = from
    if (to) query.to = to
    if (params.allTime !== undefined) query.allTime = params.allTime
    return apiClient.get('/api/analytics/line-chart', query)
  },

  getBarChart: async (params = {}) => {
    const query = {}
    const from = toIsoOrNull(params.from)
    const to = toIsoOrNull(params.to)
    if (from) query.from = from
    if (to) query.to = to
    if (params.allTime !== undefined) query.allTime = params.allTime
    return apiClient.get('/api/analytics/bar-chart', query)
  },

  logEvents: async (events = []) => {
    if (!Array.isArray(events) || events.length === 0) {
      throw new Error('events must be a non-empty array')
    }

    if (events.length > 500) {
      throw new Error('Max events per request is 500')
    }

    const normalizedEvents = events.map((item) => {
      const clientTimestamp = toIsoOrNull(item.timestamp || item.clientTimestamp || new Date())
      const eventTimestamp = toIsoOrNull(item?.event?.timestamp || item.timestamp || new Date())

      return {
        appName: item.appName || 'AlHalAdmin',
        appVersion: item.appVersion || 'web',
        platform: item.platform || 'web',
        deviceBrand: item.deviceBrand || 'browser',
        deviceModel: item.deviceModel || navigator.userAgent,
        osVersion: item.osVersion || navigator.platform,
        userId: item.userId ?? null,
        sessionId: item.sessionId || `web_${Date.now()}`,
        timestamp: clientTimestamp || new Date().toISOString(),
        event: {
          type: item?.event?.type || 'custom_event',
          level: item?.event?.level || 'info',
          screen: item?.event?.screen || 'unknown',
          message: item?.event?.message || '',
          metadata: cleanEventMetadata(item?.event?.metadata),
          timestamp: eventTimestamp || new Date().toISOString(),
        },
      }
    })

    return apiClient.post('/api/analytics/events', { events: normalizedEvents })
  },
}

export default analyticsService
