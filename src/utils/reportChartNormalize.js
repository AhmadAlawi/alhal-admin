/**
 * Normalize heterogeneous report API payloads into chart-ready datasets.
 */

import { formatChartShortDate, formatDistributionChart, safeChartNumber } from './chartNormalize'

const DATE_KEYS = new Set([
  'date',
  'time',
  'period',
  'day',
  'month',
  'year',
  'createdAt',
  'updatedAt',
  'timestamp',
  'clientTimestamp',
])

const NAME_KEYS = [
  'name',
  'nameAr',
  'nameEn',
  'label',
  'category',
  'type',
  'productName',
  'product',
  'governorate',
  'governorateNameAr',
  'governorateNameEn',
  'location',
  'method',
  'status',
  'title',
  'userType',
  'paymentMethod',
  'warehouse',
  'area',
  'region',
]

const VALUE_KEYS = [
  'value',
  'count',
  'total',
  'amount',
  'revenue',
  'totalRevenue',
  'totalSales',
  'quantity',
  'volume',
  'totalVolume',
  'totalQuantity',
  'price',
  'avgPrice',
  'averagePrice',
  'pricePerUnit',
  'profit',
  'loss',
  'expenses',
  'bids',
  'offers',
  'transactions',
  'rating',
  'score',
  'percentage',
  'percent',
]

const SKIP_SUMMARY_KEYS = new Set([
  'page',
  'pageSize',
  'totalPages',
  'totalCount',
  'success',
  'message',
  'data',
])

const SKIP_CHART_KEYS = new Set([
  'id',
  'auctionId',
  'tenderId',
  'listingId',
  'productId',
  'userId',
  'governorateId',
  'categoryId',
  'orderId',
  'page',
  'pageSize',
])

function isDateKey(key) {
  if (DATE_KEYS.has(key)) return true
  const lower = key.toLowerCase()
  return lower.includes('date') || lower.includes('time') || lower === 'period'
}

function isNameKey(key) {
  if (NAME_KEYS.includes(key)) return true
  const lower = key.toLowerCase()
  return lower.includes('name') || lower === 'label' || lower === 'category' || lower === 'type'
}

function pickNumericKeys(row) {
  if (!row || typeof row !== 'object') return []
  return Object.keys(row).filter((k) => !SKIP_CHART_KEYS.has(k) && typeof row[k] === 'number')
}

function pickNameKey(row) {
  if (!row || typeof row !== 'object') return 'name'
  const found = NAME_KEYS.find((k) => row[k] != null && typeof row[k] !== 'object')
  if (found) return found
  const stringKey = Object.keys(row).find(
    (k) => !SKIP_CHART_KEYS.has(k) && typeof row[k] === 'string' && !isDateKey(k)
  )
  return stringKey || 'name'
}

function pickValueKey(row, preferred = []) {
  const nums = pickNumericKeys(row)
  for (const key of preferred) {
    if (nums.includes(key)) return key
  }
  for (const key of VALUE_KEYS) {
    if (nums.includes(key)) return key
  }
  return nums[0] || 'value'
}

function pickPeriodKey(row) {
  if (!row || typeof row !== 'object') return 'date'
  const found = Object.keys(row).find((k) => isDateKey(k))
  return found || 'date'
}

/** Unwrap arrays from common API report shapes. */
export function extractReportRows(raw) {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw

  if (typeof raw !== 'object') return []

  const nested = [
    raw.data,
    raw.items,
    raw.results,
    raw.rows,
    raw.records,
    raw.list,
    raw.distribution,
    raw.series,
    raw.points,
  ]

  for (const candidate of nested) {
    if (Array.isArray(candidate)) return candidate
    if (candidate && typeof candidate === 'object') {
      if (Array.isArray(candidate.data)) return candidate.data
      if (Array.isArray(candidate.items)) return candidate.items
    }
  }

  // Flat key -> number map (e.g. payment methods breakdown)
  const entries = Object.entries(raw).filter(
    ([key, val]) =>
      typeof val === 'number' &&
      !SKIP_SUMMARY_KEYS.has(key) &&
      !SKIP_CHART_KEYS.has(key)
  )
  if (entries.length > 0 && entries.length <= 40) {
    return entries.map(([name, value]) => ({ name, value }))
  }

  // Single object row with metrics
  const numericKeys = pickNumericKeys(raw)
  const nameKey = pickNameKey(raw)
  if (numericKeys.length > 0 && raw[nameKey] != null) {
    return [raw]
  }

  return []
}

export function extractReportSummary(raw, rows) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    if (rows?.[0] && typeof rows[0] === 'object') {
      const s = {}
      Object.entries(rows[0]).forEach(([k, v]) => {
        if (typeof v === 'number' && !SKIP_SUMMARY_KEYS.has(k)) s[k] = v
      })
      return Object.keys(s).length ? s : null
    }
    return null
  }

  const summary = raw.summary || raw.totals || raw.aggregates
  if (summary && typeof summary === 'object' && !Array.isArray(summary)) {
    return summary
  }

  const flat = {}
  Object.entries(raw).forEach(([key, val]) => {
    if (typeof val === 'number' && !SKIP_SUMMARY_KEYS.has(key)) {
      flat[key] = val
    }
  })
  return Object.keys(flat).length ? flat : null
}

function inferChartKind(reportId, rows) {
  if (!rows.length) return 'empty'

  const id = reportId || ''
  const first = rows[0]

  if (typeof first !== 'object') {
    return 'distribution'
  }

  const keys = Object.keys(first)
  const periodKey = pickPeriodKey(first)
  const hasPeriod = rows.some((r) => r[periodKey] != null)
  const numericKeys = pickNumericKeys(first)

  if (
    id.includes('trend') ||
    id.includes('activity') ||
    id.includes('movement') ||
    id.includes('revenue') ||
    id.includes('registrations') ||
    id.includes('market-trends') ||
    id.includes('supply-demand') ||
    id.includes('profit-loss')
  ) {
    if (hasPeriod || numericKeys.length >= 1) return 'timeseries'
  }

  if (hasPeriod && numericKeys.length >= 1) return 'timeseries'

  if (
    id.includes('distribution') ||
    id.includes('category') ||
    id.includes('type') ||
    id.includes('method') ||
    id.includes('location') && !id.includes('trend')
  ) {
    return 'distribution'
  }

  if (numericKeys.length > 1 && hasPeriod) return 'timeseries'

  return 'bar'
}

function normalizeTimeSeriesRows(rows, locale) {
  const periodKey = pickPeriodKey(rows[0])
  const numericKeys = pickNumericKeys(rows[0])
  const preferred = [
    'pricePerUnit',
    'avgPrice',
    'averagePrice',
    'revenue',
    'totalRevenue',
    'totalSales',
    'count',
    'quantity',
    'volume',
    'value',
  ]
  numericKeys.sort((a, b) => {
    const ai = preferred.indexOf(a)
    const bi = preferred.indexOf(b)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  const data = rows.map((row) => {
    const out = {}
    const rawPeriod = row[periodKey]
    out[periodKey] =
      typeof rawPeriod === 'string' && rawPeriod.length > 6
        ? formatChartShortDate(rawPeriod, locale)
        : rawPeriod ?? ''
    numericKeys.forEach((k) => {
      out[k] = safeChartNumber(row[k])
    })
    return out
  })

  return { periodKey, numericKeys, data }
}

function normalizeBarRows(rows) {
  const nameKey = pickNameKey(rows[0])
  const valueKey = pickValueKey(rows[0])

  const data = rows.map((row, index) => {
    const label =
      row.governorateNameAr ||
      row.governorateNameEn ||
      row.governorateName ||
      row[nameKey] ||
      row.productName ||
      row.productNameAr ||
      row.productNameEn ||
      row.userTypeNameAr ||
      row.userTypeNameEn ||
      row.label ||
      row.name ||
      row.nameAr ||
      row.nameEn ||
      row.title ||
      row.type ||
      row.status ||
      (nameKey === 'governorateId' && row.governorateId != null
        ? `محافظة ${row.governorateId}`
        : null) ||
      `#${index + 1}`
    return {
      name: String(label),
      value: safeChartNumber(row[valueKey] ?? row.value ?? row.count ?? row.total),
    }
  })

  return { nameKey: 'name', valueKey: 'value', data: data.slice(0, 25) }
}

/** Build chart props for Reports page. */
export function buildReportChartConfig(raw, reportId, locale = 'en-US') {
  const rows = extractReportRows(raw)
  const kind = inferChartKind(reportId, rows)
  const summary = extractReportSummary(raw, rows)

  if (kind === 'empty' || rows.length === 0) {
    return { kind: 'empty', summary, rows: [] }
  }

  if (kind === 'timeseries') {
    const { periodKey, numericKeys, data } = normalizeTimeSeriesRows(rows, locale)
    const useComposed = numericKeys.length > 1
    const colors = ['#15803d', '#16a34a', '#059669', '#22c55e', '#0d9488']

    if (useComposed) {
      return {
        kind: 'composed',
        summary,
        rows: data,
        periodKey,
        dataKeys: numericKeys.slice(0, 4).map((key, index) => ({
          dataKey: key,
          name: key,
          type: index === numericKeys.length - 1 ? 'line' : 'bar',
          color: colors[index % colors.length],
        })),
      }
    }

    return {
      kind: 'area',
      summary,
      rows: data,
      periodKey,
      dataKey: numericKeys[0] || 'value',
    }
  }

  if (kind === 'distribution') {
    const pieBar = formatDistributionChart(rows.length ? rows : normalizeBarRows(rows).data)
    return {
      kind: 'distribution',
      summary,
      rows: pieBar.data,
      nameKey: pieBar.nameKey,
      valueKey: pieBar.valueKey,
    }
  }

  const bar = normalizeBarRows(rows)
  return {
    kind: 'bar',
    summary,
    rows: bar.data,
    nameKey: bar.nameKey,
    valueKey: bar.valueKey,
  }
}
