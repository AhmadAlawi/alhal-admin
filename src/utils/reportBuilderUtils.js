export const OPERATORS_BY_TYPE = {
  string: ['eq', 'neq', 'contains', 'startswith', 'in', 'isNull', 'isNotNull'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in'],
  decimal: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in'],
  date: ['eq', 'between', 'gte', 'lte', 'lastNDays'],
  datetime: ['eq', 'between', 'gte', 'lte', 'lastNDays'],
  boolean: ['eq'],
  enum: ['eq', 'neq', 'in'],
  foreignKey: ['eq', 'in', 'isNull'],
}

export function defaultAlias(tableId) {
  return tableId.split('_').map((p) => p[0]).join('') || 't'
}

export function resolveTableAlias(tableId, primaryTableId, primaryAlias, joins) {
  if (tableId === primaryTableId) return primaryAlias
  return joins.find((j) => j.targetTableId === tableId)?.alias || null
}

/** Build join ON from API relationship (supports chained joins). */
export function buildJoinOn(rel, targetAlias, primaryTableId, primaryAlias, joins) {
  const fromDot = rel.fromColumn.indexOf('.')
  const toDot = rel.toColumn.indexOf('.')
  const fromTableId = rel.fromColumn.slice(0, fromDot)
  const fromCol = rel.fromColumn.slice(fromDot + 1)
  const toCol = rel.toColumn.slice(toDot + 1)

  const fromAlias = resolveTableAlias(fromTableId, primaryTableId, primaryAlias, joins)
  if (!fromAlias) {
    return { from: rel.fromColumn, to: `${targetAlias}.${toCol}` }
  }

  return {
    from: `${fromAlias}.${fromCol}`,
    to: `${targetAlias}.${toCol}`,
  }
}

/** Join options from primary + already-joined tables (e.g. products → government_prices). */
export function collectAvailableJoins(primaryDetail, joinedSchemas, primaryTableId, joins) {
  const joinedIds = new Set(joins.map((j) => j.targetTableId))
  const seenTargets = new Set()
  const available = []

  const addFromSchema = (sourceTableId, schema) => {
    if (!schema?.relationships) return
    const sourceName = schema.table?.name || sourceTableId
    const sourceNameAr = schema.table?.nameAr || sourceName

    schema.relationships.forEach((rel) => {
      if (rel.targetTable === primaryTableId) return
      if (joinedIds.has(rel.targetTable)) return
      if (seenTargets.has(rel.targetTable)) return
      seenTargets.add(rel.targetTable)
      available.push({ sourceTableId, sourceName, sourceNameAr, rel })
    })
  }

  addFromSchema(primaryTableId, primaryDetail)
  joins.forEach((j) => addFromSchema(j.targetTableId, joinedSchemas[j.targetTableId]))

  return available
}

export function getGovernmentPricesJoin(joins) {
  return joins.find((j) => j.targetTableId === 'government_prices') || null
}

export function buildCurrentGovPriceFilter(gpAlias) {
  return { columnId: `${gpAlias}.EffectiveTo`, operator: 'isNull' }
}

export function hasCurrentGovPriceFilter(filters, gpAlias) {
  const col = `${gpAlias}.EffectiveTo`
  return filters.some((f) => f.columnId === col && f.operator === 'isNull')
}

export function getJoinsToRemoveWith(targetTableId, joins) {
  const toRemove = new Set([targetTableId])
  let changed = true
  while (changed) {
    changed = false
    joins.forEach((j) => {
      if (toRemove.has(j.targetTableId)) return
      const fromTable = j.on?.from?.split('.')[0]
      if (fromTable && [...toRemove].some((id) => {
        const alias = joins.find((x) => x.targetTableId === id)?.alias
        return alias === fromTable
      })) {
        toRemove.add(j.targetTableId)
        changed = true
      }
    })
  }
  return toRemove
}

export function emptyQuery() {
  return {
    version: 1,
    sources: [],
    joins: [],
    select: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    pagination: { page: 1, pageSize: 50 },
  }
}

export function resolveColumnId(col, primaryTableId, primaryAlias, joins) {
  if (typeof col === 'string') {
    const dot = col.indexOf('.')
    const tableId = col.slice(0, dot)
    const rest = col.slice(dot + 1)
    if (tableId === primaryTableId) return `${primaryAlias}.${rest}`
    const join = joins.find((j) => j.targetTableId === tableId)
    return join ? `${join.alias}.${rest}` : col
  }

  const tablePrefixFromId = col.id.split('.')[0]
  if (tablePrefixFromId === primaryTableId) {
    return col.id.replace(`${primaryTableId}.`, `${primaryAlias}.`)
  }
  const join = joins.find((j) => j.targetTableId === tablePrefixFromId)
  if (join) {
    return col.id.replace(`${tablePrefixFromId}.`, `${join.alias}.`)
  }
  return col.id
}

export function getColumnMeta(resolvedColumnId, primaryDetail, joinedSchemas, primaryAlias, joins) {
  const dot = resolvedColumnId.indexOf('.')
  if (dot === -1) return null
  const alias = resolvedColumnId.slice(0, dot)
  const colName = resolvedColumnId.slice(dot + 1)

  if (alias === primaryAlias) {
    return primaryDetail?.columns?.find((c) => c.name === colName) || null
  }
  const join = joins.find((j) => j.alias === alias)
  if (!join) return null
  return joinedSchemas[join.targetTableId]?.columns?.find((c) => c.name === colName) || null
}

export function collectColumnGroups(primaryDetail, joinedSchemas, primaryTableId, primaryAlias, joins, language) {
  const groups = []

  if (primaryDetail?.columns?.length) {
    groups.push({
      key: primaryTableId,
      label: language === 'ar' ? primaryDetail.table?.nameAr : primaryDetail.table?.name,
      columns: primaryDetail.columns.map((c) => ({
        ...c,
        resolvedId: resolveColumnId(c, primaryTableId, primaryAlias, joins),
      })),
    })
  }

  joins.forEach((j) => {
    const schema = joinedSchemas[j.targetTableId]
    if (!schema?.columns?.length) return
    groups.push({
      key: j.targetTableId,
      label: language === 'ar' ? schema.table?.nameAr : schema.table?.name,
      columns: schema.columns.map((c) => ({
        ...c,
        resolvedId: resolveColumnId(c, primaryTableId, primaryAlias, joins),
      })),
    })
  })

  return groups
}

export function buildDefaultSelect(tableDetail, primaryTableId, primaryAlias) {
  const defaults = tableDetail?.table?.defaultColumns || []
  return defaults.map((name) => {
    const col = tableDetail?.columns?.find((c) => c.name === name)
    if (!col) return null
    return {
      columnId: resolveColumnId(col, primaryTableId, primaryAlias, []),
      alias: name,
    }
  }).filter(Boolean)
}

export function computeGroupBy(select) {
  return select
    .filter((s) => !s.aggregate)
    .map((s) => s.alias || s.columnId.split('.').pop())
}

export function formatValidationItem(item) {
  if (typeof item === 'string') return item
  if (item?.detail) return item.detail
  if (item?.message) return item.message
  if (item?.code) return item.code
  return JSON.stringify(item)
}

export function resultsToTableColumns(resultColumns) {
  return (resultColumns || []).map((c) => ({
    header: c.label,
    accessor: c.id,
  }))
}

export function resultsToChartProps(preview) {
  if (!preview?.chartHints || !preview?.rows?.length) return null
  const { xAxis, yAxis, chartType } = preview.chartHints
  const typeMap = { line: 'line', bar: 'bar', area: 'area', pie: 'pie' }
  return {
    type: typeMap[chartType] || 'line',
    data: preview.rows,
    xAxisKey: xAxis,
    dataKey: yAxis?.[0] || 'value',
    ...(typeMap[chartType] === 'pie' ? { nameKey: xAxis } : {}),
  }
}

export const CHART_TYPES = ['line', 'bar', 'area', 'pie']

export function emptyVisualization() {
  return {
    enabled: false,
    chartType: 'line',
    xAxis: '',
    yAxis: '',
  }
}

export function stripQueryDefinition(definition) {
  if (!definition) return definition
  const { visualization, ...query } = definition
  return query
}

export function extractVisualization(definition) {
  const viz = definition?.visualization
  if (!viz) return emptyVisualization()
  return { ...emptyVisualization(), ...viz }
}

export function attachVisualization(definition, visualization) {
  return { ...definition, visualization }
}

export function buildChartPropsFromResults(results, visualization) {
  if (visualization?.enabled && visualization.chartType && visualization.xAxis && visualization.yAxis) {
    if (!results?.rows?.length) return null
    const props = {
      type: visualization.chartType,
      data: results.rows,
      xAxisKey: visualization.xAxis,
      dataKey: visualization.yAxis,
    }
    if (visualization.chartType === 'pie') {
      props.nameKey = visualization.xAxis
    }
    return props
  }
  return resultsToChartProps(results)
}

export function suggestChartAxes(select, primaryDetail, joinedSchemas, primaryAlias, joins) {
  const xCandidates = []
  const yCandidates = []

  select.forEach((s) => {
    const alias = s.alias || s.columnId.split('.').pop()
    const meta = getColumnMeta(s.columnId, primaryDetail, joinedSchemas, primaryAlias, joins)
    const type = meta?.type

    if (!s.aggregate && ['string', 'enum', 'date', 'datetime', 'foreignKey', 'boolean'].includes(type)) {
      xCandidates.push({ alias, label: meta?.label || alias, labelAr: meta?.labelAr })
    }
    if (s.aggregate || ['number', 'decimal'].includes(type)) {
      yCandidates.push({ alias, label: meta?.label || alias, labelAr: meta?.labelAr })
    }
  })

  return { xCandidates, yCandidates }
}

export function getDefaultVisualization(select, primaryDetail, joinedSchemas, primaryAlias, joins) {
  const { xCandidates, yCandidates } = suggestChartAxes(
    select,
    primaryDetail,
    joinedSchemas,
    primaryAlias,
    joins
  )
  return {
    enabled: xCandidates.length > 0 && yCandidates.length > 0,
    chartType: 'line',
    xAxis: xCandidates[0]?.alias || '',
    yAxis: yCandidates[0]?.alias || '',
  }
}
