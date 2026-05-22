/**
 * Normalize gov dashboard API responses (wrapped ApiResponse or raw JSON).
 */
export function unwrapDashboardPayload(response) {
  if (response == null) return null
  if (response.success === true && response.data != null) {
    const inner = response.data
    if (inner?.overview || inner?.marketAnalysis || inner?.salesMetrics) return inner
    if (inner?.data) return inner.data
    return inner
  }
  if (response.data?.overview || response.data?.marketAnalysis) return response.data
  if (response.overview || response.marketAnalysis) return response
  return response.data ?? response
}

export function unwrapRealTimePayload(response) {
  if (response == null) return null
  if (response.success === true && response.data != null) return response.data
  if (response.timestamp || response.todayStats) return response
  return response.data ?? response
}

export function safeNum(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function fmtNum(value) {
  return safeNum(value).toLocaleString()
}
