import { fmtNum, safeNum } from './dashboardNormalize'

function pickLabel(item, language, arKey = 'nameAr', enKey = 'nameEn') {
  if (!item) return ''
  if (language === 'ar') return item[arKey] || item[enKey] || item.name || item.title || ''
  return item[enKey] || item[arKey] || item.name || item.title || ''
}

function pickSliceLabel(slice, language, index) {
  const candidates = [
    pickLabel(slice, language, 'nameAr', 'nameEn'),
    pickLabel(slice, language, 'labelAr', 'labelEn'),
    pickLabel(slice, language, 'titleAr', 'titleEn'),
    slice?.label,
    slice?.name,
    slice?.category,
    slice?.key,
    slice?.type,
    slice?.userType,
    slice?.status,
    slice?.packagingType,
    slice?.landOwnershipType,
  ].filter(Boolean)
  const found = candidates.find((c) => !/^#\d+$/.test(String(c)))
  return found || `#${index + 1}`
}

function isGovernorateColumnKey(key) {
  if (!key) return false
  const k = String(key).toLowerCase()
  return (
    k === 'governorateid' ||
    k === 'governorate' ||
    k.includes('governorate') ||
    k === 'sourcegovernorateid' ||
    k === 'targetgovernorateid' ||
    k === 'fromgovernorateid' ||
    k === 'togovernorateid' ||
    k === 'destinationgovernorateid'
  )
}

function resolveGovernorateCell(value, governorateLookup, language) {
  if (value == null || value === '') return value
  const entry = governorateLookup?.get?.(String(value))
  if (!entry) return value
  return language === 'ar' ? entry.nameAr || entry.name : entry.nameEn || entry.name
}

function normalizeKpi(data, language) {
  const unit = language === 'ar' ? data?.unitAr : data?.unitEn || data?.unitAr
  const value = data?.value
  const formatted =
    value != null ? `${fmtNum(value)}${unit ? ` ${unit}` : ''}` : '—'

  return {
    kind: 'kpi',
    value: formatted,
    change: data?.changePercent,
    items: (data?.items || []).map((item) => ({
      label: pickLabel(item, language, 'keyAr', 'keyEn'),
      value: fmtNum(item.value),
    })),
  }
}

function normalizeSeriesChart(data, language, chartType) {
  const categories = Array.isArray(data?.categories) ? data.categories : []
  const series = Array.isArray(data?.series) ? data.series : []
  const xAxisKey = '__category'

  const chartRows = categories.map((cat, idx) => {
    const row = { [xAxisKey]: String(cat) }
    series.forEach((s, si) => {
      const key = s.key || `series_${si}`
      row[key] = s.data?.[idx] ?? null
    })
    return row
  })

  const dataKeys = series.map((s, si) => ({
    dataKey: s.key || `series_${si}`,
    name: pickLabel(s, language),
  }))

  return {
    kind: 'chart',
    chartType,
    data: chartRows,
    dataKeys: dataKeys.length > 0 ? dataKeys : undefined,
    dataKey: dataKeys[0]?.dataKey,
    xAxisKey,
    scrollable: categories.length > 6,
  }
}

function normalizeDonut(data, language) {
  const slices = Array.isArray(data?.slices) ? data.slices : []
  return {
    kind: 'chart',
    chartType: 'pie',
    data: slices.map((slice, i) => ({
      name: pickSliceLabel(slice, language, i),
      value: safeNum(slice.value),
    })),
    dataKey: 'value',
    nameKey: 'name',
    pieLabel: true,
  }
}

function normalizeTable(data, language, governorateLookup) {
  const columns = (data?.columns || []).map((col) => ({
    header: pickLabel(col, language, 'titleAr', 'titleEn') || col.key,
    accessor: col.key,
  }))
  const rows = (Array.isArray(data?.rows) ? data.rows : []).map((row) => {
    if (!governorateLookup?.size) return row
    const out = { ...row }
    columns.forEach((col) => {
      if (isGovernorateColumnKey(col.accessor) && out[col.accessor] != null) {
        const resolved = resolveGovernorateCell(out[col.accessor], governorateLookup, language)
        if (resolved !== out[col.accessor]) out[col.accessor] = resolved
      }
      const nameField = `${col.accessor}NameAr`
      if (out[nameField] == null && isGovernorateColumnKey(col.accessor)) {
        const resolved = resolveGovernorateCell(out[col.accessor], governorateLookup, language)
        if (resolved) out[col.accessor] = resolved
      }
    })
    return out
  })
  return {
    kind: 'table',
    columns,
    rows,
    totalRows: data?.totalRows ?? rows.length ?? 0,
  }
}

function normalizeMap(data, language) {
  const points = Array.isArray(data?.points) ? data.points : []
  return {
    kind: 'map',
    points: points.map((p) => ({
      name: pickLabel(p, language) || p.governorate || p.name,
      value: fmtNum(p.value ?? p.quantity ?? 0),
      governorateId: p.governorateId,
    })),
  }
}

function normalizeCombo(data, language) {
  const tablePart = data?.table ? normalizeTable(data.table, language) : null
  const chartPart = data?.chart
    ? normalizeSeriesChart(data.chart, language, 'bar')
    : data?.categories
      ? normalizeSeriesChart(data, language, 'bar')
      : null

  return {
    kind: 'combo',
    table: tablePart,
    chart: chartPart,
  }
}

/** API detailTable → { columns, rows, totalRows } for UI / print */
export function normalizeDetailTable(detailTable, language = 'ar') {
  if (!detailTable?.rows?.length) return null

  const columns = (detailTable.columns || []).map((col) => ({
    header:
      col.header ||
      pickLabel(col, language, 'titleAr', 'titleEn') ||
      col.key ||
      col.accessor,
    accessor: col.accessor || col.key,
  }))

  return {
    columns,
    rows: detailTable.rows,
    totalRows: detailTable.totalRows ?? detailTable.rows.length,
  }
}

/** Map API report envelope → widget render props */
export function normalizeGovAnalyticsPayload(envelope, language = 'ar', options = {}) {
  const governorateLookup = options.governorateLookup
  const payload =
    envelope?.visualizationType != null
      ? envelope
      : envelope?.data?.visualizationType != null
        ? envelope.data
        : envelope

  const inner = payload?.data
  const vizType = payload?.visualizationType

  if (inner == null && vizType !== 'kpi') {
    return { kind: 'empty' }
  }

  let result
  switch (vizType) {
    case 'kpi':
      result = normalizeKpi(inner, language)
      break
    case 'column':
      result = normalizeSeriesChart(inner, language, 'bar')
      break
    case 'line':
      result = normalizeSeriesChart(inner, language, 'line')
      break
    case 'donut':
      result = normalizeDonut(inner, language)
      break
    case 'table':
      result = normalizeTable(inner, language, governorateLookup)
      break
    case 'map':
      result = normalizeMap(inner, language)
      break
    case 'combo':
      result = normalizeCombo(inner, language)
      break
    default:
      result = { kind: 'empty' }
  }

  const detailTable = normalizeDetailTable(payload?.detailTable, language)
  if (detailTable) {
    return { ...result, detailTable }
  }

  return result
}

export function mergeAnalyticsFilters(globalFilters = {}, widgetFilters = {}) {
  const merged = { ...widgetFilters }

  const days = globalFilters.days ?? widgetFilters.days
  if (days != null && Number(days) > 0) {
    merged.days = Number(days)
  } else {
    delete merged.days
  }

  if (globalFilters.governorateId != null && globalFilters.governorateId !== '') {
    merged.governorateId = Number(globalFilters.governorateId)
  }

  if (widgetFilters.productId != null && widgetFilters.productId !== '') {
    merged.productId = Number(widgetFilters.productId)
  }

  const granularity = globalFilters.granularity ?? widgetFilters.granularity
  if (granularity) merged.granularity = granularity
  if (widgetFilters.topN) merged.topN = widgetFilters.topN
  if (widgetFilters.from) merged.from = widgetFilters.from
  if (widgetFilters.to) merged.to = widgetFilters.to
  if (widgetFilters.includeDetail != null) merged.includeDetail = widgetFilters.includeDetail

  return merged
}

export function unwrapAnalyticsList(response) {
  const payload = response?.data ?? response
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export function unwrapAnalyticsReport(response) {
  return response?.data ?? response
}
