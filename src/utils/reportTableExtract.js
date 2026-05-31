/** Build { columns, rows } from loaded widget/report data for display & print */

function columnsFromRows(rows) {
  if (!rows?.length) return { columns: [], rows: [] }
  const keys = Object.keys(rows[0])
  return {
    columns: keys.map((key) => ({
      header: key,
      accessor: key,
    })),
    rows,
  }
}

function detailTableToUi(detailTable) {
  if (!detailTable?.rows?.length) return null
  if (detailTable.columns?.[0]?.accessor) {
    return { columns: detailTable.columns, rows: detailTable.rows }
  }
  return null
}

function chartDataToTable(data) {
  if (!data?.data?.length) return null

  if (data.chartType === 'pie') {
    return {
      columns: [
        { header: 'name', accessor: 'name' },
        { header: 'value', accessor: 'value' },
      ],
      rows: data.data,
    }
  }

  const xKey = data.xAxisKey || 'name'
  const seriesKeys =
    data.dataKeys?.map((s) => ({ header: s.name || s.dataKey, accessor: s.dataKey })) ||
    (data.dataKey ? [{ header: data.dataKey, accessor: data.dataKey }] : [])

  return {
    columns: [{ header: xKey, accessor: xKey }, ...seriesKeys],
    rows: data.data,
  }
}

function kpiToTable(data, t) {
  const rows = [{ [t('reportActions.value')]: data.value }]
  if (data.change != null) {
    rows[0][t('reportActions.change')] = `${data.change}%`
  }
  if (data.items?.length) {
    data.items.forEach((item) => {
      rows.push({ [t('reportActions.value')]: `${item.label}: ${item.value}` })
    })
  }
  return columnsFromRows(rows)
}

function mapToTable(data) {
  if (!data.points?.length) return null
  return {
    columns: [
      { header: 'name', accessor: 'name' },
      { header: 'value', accessor: 'value' },
    ],
    rows: data.points,
  }
}

function normalizeRawDetailTable(detailTable, language) {
  if (!detailTable?.rows?.length) return null
  if (detailTable.columns?.length) {
    return {
      columns: detailTable.columns.map((col) => ({
        header:
          col.header ||
          (language === 'ar'
            ? col.titleAr || col.titleEn || col.key
            : col.titleEn || col.titleAr || col.key),
        accessor: col.accessor || col.key,
      })),
      rows: detailTable.rows,
    }
  }
  return columnsFromRows(detailTable.rows)
}

export function extractTableFromReportData(data, widget, { language = 'ar', t = (k) => k } = {}) {
  if (!data) return null

  const fromNormalized = detailTableToUi(data.detailTable)
  if (fromNormalized) return fromNormalized

  if (data.detailTable) {
    const fromDetail = normalizeRawDetailTable(data.detailTable, language)
    if (fromDetail?.rows?.length) return fromDetail
  }

  if (data.kind === 'table') {
    return data.rows?.length ? { columns: data.columns, rows: data.rows } : null
  }

  if (data.kind === 'combo') {
    if (data.table?.rows?.length) return data.table
    if (data.chart) return chartDataToTable(data.chart)
  }

  if (data.kind === 'chart') return chartDataToTable(data)

  if (data.kind === 'map') return mapToTable(data)

  if (data.kind === 'kpi') return kpiToTable(data, t)

  if (data.kind === 'report' && data.payload) {
    const rows = data.payload?.rows || data.payload?.data || data.payload?.items
    if (Array.isArray(rows) && rows.length) return columnsFromRows(rows)
    if (data.chartConfig?.data?.length) return chartDataToTable(data.chartConfig)
  }

  if (data.kind === 'saved-report' && data.results?.rows?.length) {
    const cols = data.results.columns
    if (cols?.length) {
      return {
        columns: cols.map((c) => ({
          header: language === 'ar' ? c.labelAr || c.label : c.label || c.alias,
          accessor: c.alias || c.key,
        })),
        rows: data.results.rows,
      }
    }
    return columnsFromRows(data.results.rows)
  }

  if (widget?.type === 'builtin-chart' && data.kind === 'chart') {
    return chartDataToTable(data)
  }

  return null
}
