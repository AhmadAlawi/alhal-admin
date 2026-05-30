export function getCompatibleChartTypes({
  type,
  dataKeys = [],
  xAxisKey,
  nameKey,
  dataKey,
}) {
  const categoryKey = xAxisKey || nameKey
  const hasValue = Boolean(dataKey || dataKeys.length > 0)

  if (dataKeys.length > 1) {
    return ['line', 'bar', 'composed']
  }

  if (!categoryKey || !hasValue) {
    return [type]
  }

  const types = ['line', 'bar', 'area', 'pie']
  if (type === 'composed' && !types.includes('composed')) {
    return ['line', 'bar', 'composed']
  }

  return types
}

export function resolveChartKeys(activeType, { xAxisKey, nameKey, dataKey }) {
  const categoryKey = xAxisKey || nameKey

  if (activeType === 'pie') {
    return {
      xAxisKey: undefined,
      nameKey: nameKey || xAxisKey || 'name',
      dataKey,
    }
  }

  return {
    xAxisKey: xAxisKey || nameKey,
    nameKey: nameKey || xAxisKey || 'name',
    dataKey,
    categoryKey,
  }
}
