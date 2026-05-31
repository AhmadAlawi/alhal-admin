import govAnalyticsService from './govAnalyticsService'
import { unwrapAnalyticsReport } from '../utils/govAnalyticsNormalize'

const cache = new Map()
const inflight = new Map()

function cacheKey(reportId, filters) {
  return `${reportId}:${JSON.stringify(filters || {})}`
}

export async function getCachedAnalyticsReport(reportId, filters = {}) {
  const key = cacheKey(reportId, filters)
  if (cache.has(key)) return cache.get(key)

  if (inflight.has(key)) return inflight.get(key)

  const promise = govAnalyticsService
    .getReport(reportId, filters)
    .then((res) => {
      const payload = unwrapAnalyticsReport(res)
      cache.set(key, payload)
      inflight.delete(key)
      return payload
    })
    .catch((err) => {
      inflight.delete(key)
      throw err
    })

  inflight.set(key, promise)
  return promise
}

export function clearAnalyticsReportCache() {
  cache.clear()
}
