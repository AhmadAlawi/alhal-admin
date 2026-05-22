/**
 * Coerce API numeric fields; status breakdown objects sum to a total count.
 */
export function toPositiveNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n) && n >= 0) return n
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sum = Object.values(value).reduce((acc, v) => {
      const n = Number(v)
      return acc + (Number.isFinite(n) ? n : 0)
    }, 0)
    if (sum >= 0) return sum
  }
  return fallback
}

export function isStatusBreakdown(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  const keys = Object.keys(obj)
  const statusKeys = ['open', 'pending', 'negotiating', 'completed', 'cancelled']
  return keys.length > 0 && keys.every((k) => statusKeys.includes(k) || typeof obj[k] === 'number')
}

/**
 * Parse paginated list responses (ApiResponse wrapper or legacy shapes).
 */
function extractListArray(root, response) {
  if (Array.isArray(root)) return root
  if (!root || typeof root !== 'object') {
    if (Array.isArray(response?.items)) return response.items
    return []
  }
  if (Array.isArray(root.items)) return root.items
  if (Array.isArray(root.requests)) return root.requests
  if (Array.isArray(root.results)) return root.results
  if (Array.isArray(response?.items)) return response.items
  return []
}

export function normalizeTransportRequest(row) {
  if (!row || typeof row !== 'object' || isStatusBreakdown(row)) return null
  const id = row.transportRequestId ?? row.requestId ?? row.id
  if (id == null) return null

  let status = row.status
  if (status != null && typeof status === 'object') {
    status = status.name ?? status.value ?? status.code ?? ''
  }

  return {
    ...row,
    transportRequestId: id,
    status: typeof status === 'string' ? status : String(status || ''),
  }
}

export function parsePaginatedList(response) {
  let items = []
  let total = 0
  let totalPages = 1
  let statusCounts = null

  const root = response?.data?.data ?? response?.data ?? response

  if (!root) {
    return { items, total, totalPages, statusCounts }
  }

  // Entire payload is status breakdown only (no list)
  if (isStatusBreakdown(root) && !Array.isArray(root.items)) {
    statusCounts = { ...root }
    total = toPositiveNumber(root)
    return { items: [], total, totalPages: 1, statusCounts }
  }

  items = extractListArray(root, response)
    .map(normalizeTransportRequest)
    .filter(Boolean)

  statusCounts =
    root.statusCounts ||
    root.statusSummary ||
    (isStatusBreakdown(root.total) ? root.total : null) ||
    (isStatusBreakdown(root.counts) ? root.counts : null) ||
    (isStatusBreakdown(root) ? root : null)

  const rawTotal = root.total ?? root.totalCount ?? response?.total ?? response?.totalCount
  if (isStatusBreakdown(rawTotal)) {
    statusCounts = statusCounts || rawTotal
    total = toPositiveNumber(rawTotal, items.length)
  } else {
    total = toPositiveNumber(rawTotal, items.length)
  }

  const rawPages = root.totalPages ?? response?.totalPages
  const pageCount = isStatusBreakdown(rawPages)
    ? Math.max(1, Math.ceil(total / 20) || 1)
    : toPositiveNumber(rawPages, Math.max(1, Math.ceil(total / 20) || 1))
  totalPages = Math.max(1, pageCount)

  return { items, total, totalPages, statusCounts }
}

export function formatCellValue(value) {
  if (value == null) return 'N/A'
  if (typeof value === 'object') return 'N/A'
  return String(value)
}
