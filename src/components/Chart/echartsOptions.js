/** Stitch green palette for ECharts */
export const CHART_COLORS = [
  '#15803d',
  '#16a34a',
  '#059669',
  '#22c55e',
  '#65a30d',
  '#0d9488',
  '#34d399',
  '#84cc16',
  '#4ade80',
  '#00652c',
]

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  borderColor: 'rgba(190, 202, 188, 0.5)',
  borderWidth: 1,
  textStyle: { color: '#0b1c30', fontFamily: 'Alexandria, sans-serif', fontSize: 12 },
  extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 8px;',
}

function categories(data, xAxisKey) {
  return data.map((row) => String(row[xAxisKey] ?? ''))
}

function seriesValues(data, key) {
  return data.map((row) => {
    const v = row[key]
    return v == null || v === '' ? null : Number(v)
  })
}

function buildTooltip(formatter, labelFormatter) {
  return {
    trigger: 'axis',
    backgroundColor: TOOLTIP_STYLE.backgroundColor,
    borderColor: TOOLTIP_STYLE.borderColor,
    borderWidth: TOOLTIP_STYLE.borderWidth,
    textStyle: TOOLTIP_STYLE.textStyle,
    extraCssText: TOOLTIP_STYLE.extraCssText,
    axisPointer: { type: 'cross', crossStyle: { color: '#becabc' } },
    formatter: formatter
      ? (params) => {
          const items = Array.isArray(params) ? params : [params]
          const label = labelFormatter
            ? labelFormatter(items[0]?.axisValue)
            : items[0]?.axisValue
          const lines = items.map((p) => {
            const result = formatter(p.value, p.seriesName, { payload: p.data })
            if (Array.isArray(result)) {
              return `${result[1] || p.seriesName}: ${result[0]}`
            }
            return `${p.seriesName}: ${result ?? p.value}`
          })
          return label ? `${label}<br/>${lines.join('<br/>')}` : lines.join('<br/>')
        }
      : undefined,
  }
}

function buildPieTooltip(formatter) {
  return {
    trigger: 'item',
    backgroundColor: TOOLTIP_STYLE.backgroundColor,
    borderColor: TOOLTIP_STYLE.borderColor,
    borderWidth: TOOLTIP_STYLE.borderWidth,
    textStyle: TOOLTIP_STYLE.textStyle,
    extraCssText: TOOLTIP_STYLE.extraCssText,
    formatter: formatter
      ? (params) => {
          const result = formatter(params.value, params.name, { payload: params.data })
          if (Array.isArray(result)) {
            return `${result[1] || params.name}: ${result[0]}`
          }
          return `${params.name}: ${result ?? params.value}`
        }
      : '{b}: {c} ({d}%)',
  }
}

function baseGrid(hasDataZoom, hasLegend, dense) {
  return {
    left: 48,
    right: 24,
    top: hasLegend ? 36 : 16,
    bottom: hasDataZoom ? 56 : dense ? 48 : 32,
    containLabel: true,
  }
}

function buildCategoryAxis(data, xAxisKey, xAxisLabel, dense, isRtl) {
  return {
    type: 'category',
    data: categories(data, xAxisKey),
    boundaryGap: true,
    axisLine: { lineStyle: { color: '#becabc' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#6f7a6e',
      fontSize: 11,
      rotate: dense ? 35 : 0,
      interval: dense ? 0 : 'auto',
      ...(isRtl ? { align: 'right' } : {}),
    },
    name: xAxisLabel || undefined,
    nameTextStyle: { color: '#6f7a6e', fontSize: 11 },
  }
}

function buildValueAxis(yAxisLabel) {
  return {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(190, 202, 188, 0.35)', type: 'dashed' } },
    axisLabel: { color: '#6f7a6e', fontSize: 11 },
    name: yAxisLabel || undefined,
    nameTextStyle: { color: '#6f7a6e', fontSize: 11 },
  }
}

function buildLegend(showLegend, legendPosition, isRtl) {
  if (!showLegend) return undefined
  return {
    show: true,
    bottom: legendPosition === 'bottom' ? 0 : undefined,
    top: legendPosition === 'top' ? 0 : undefined,
    textStyle: { color: '#3f493f', fontSize: 11 },
    ...(isRtl ? { right: 0 } : { left: 0 }),
  }
}

function buildDataZoom(dataLength, scrollable) {
  if (!scrollable || dataLength <= 4) return undefined
  const endPercent = Math.min(100, Math.round((8 / dataLength) * 100))
  return [
    {
      type: 'inside',
      start: 0,
      end: endPercent,
    },
    {
      type: 'slider',
      start: 0,
      end: endPercent,
      height: 18,
      bottom: 4,
      borderColor: 'transparent',
      backgroundColor: '#eff4ff',
      fillerColor: 'rgba(21, 128, 61, 0.15)',
      handleStyle: { color: '#15803d' },
      textStyle: { color: '#6f7a6e', fontSize: 10 },
    },
  ]
}

export function buildChartOption({
  type = 'line',
  data = [],
  dataKey,
  dataKeys = [],
  xAxisKey,
  nameKey = 'name',
  color = '#15803d',
  colors = CHART_COLORS,
  showLegend = true,
  legendPosition = 'bottom',
  yAxisLabel,
  xAxisLabel,
  tooltipFormatter,
  labelFormatter,
  pieLabel = false,
  seriesName,
  scrollable = false,
  isRtl = false,
}) {
  const chartData = Array.isArray(data) ? data : []
  const dense = chartData.length > 6
  const hasDataZoom = scrollable && chartData.length > 4
  const legend = buildLegend(showLegend, legendPosition, isRtl)

  if (type === 'pie') {
    const pieData = chartData.map((row, i) => ({
      name: String(row[nameKey] ?? `#${i + 1}`),
      value: Number(row[dataKey] ?? 0),
      itemStyle: { color: colors[i % colors.length] },
    }))
    return {
      color: colors,
      tooltip: buildPieTooltip(tooltipFormatter),
      legend: showLegend ? { ...legend, orient: 'vertical', right: isRtl ? undefined : 8, left: isRtl ? 8 : undefined } : undefined,
      series: [
        {
          type: 'pie',
          radius: ['42%', '72%'],
          center: showLegend ? ['42%', '50%'] : ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: pieLabel
            ? { show: true, formatter: '{b}: {d}%', color: '#3f493f', fontSize: 11 }
            : { show: false },
          emphasis: {
            label: { show: true, fontSize: 12, fontWeight: 600 },
            itemStyle: { shadowBlur: 12, shadowColor: 'rgba(21, 128, 61, 0.25)' },
          },
          data: pieData,
        },
      ],
    }
  }

  const grid = baseGrid(hasDataZoom, showLegend, dense)
  const categoryAxis = buildCategoryAxis(chartData, xAxisKey, xAxisLabel, dense, isRtl)
  const valueAxis = buildValueAxis(yAxisLabel)
  const tooltip = buildTooltip(tooltipFormatter, labelFormatter)
  const dataZoom = buildDataZoom(chartData.length, scrollable)

  if (type === 'area') {
    return {
      color: colors,
      grid,
      tooltip,
      legend,
      dataZoom,
      xAxis: categoryAxis,
      yAxis: valueAxis,
      series: [
        {
          name: seriesName || dataKey,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color },
          itemStyle: { color },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${color}55` },
                { offset: 1, color: `${color}08` },
              ],
            },
          },
          data: seriesValues(chartData, dataKey),
        },
      ],
    }
  }

  if (type === 'bar') {
    const series =
      dataKeys.length > 0
        ? dataKeys.map((key, index) => ({
            name: key.name || key.dataKey,
            type: 'bar',
            barMaxWidth: 36,
            itemStyle: {
              color: key.color || colors[index % colors.length],
              borderRadius: [6, 6, 0, 0],
            },
            data: seriesValues(chartData, key.dataKey),
          }))
        : [
            {
              name: seriesName || dataKey,
              type: 'bar',
              barMaxWidth: 36,
              itemStyle: { color, borderRadius: [6, 6, 0, 0] },
              data: seriesValues(chartData, dataKey),
            },
          ]

    return {
      color: colors,
      grid,
      tooltip,
      legend: dataKeys.length > 1 || showLegend ? legend : undefined,
      dataZoom,
      xAxis: { ...categoryAxis, boundaryGap: true },
      yAxis: valueAxis,
      series,
    }
  }

  if (type === 'composed') {
    const series = dataKeys.map((key, index) => {
      const c = key.color || colors[index % colors.length]
      if (key.type === 'bar') {
        return {
          name: key.name || key.dataKey,
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: { color: c, borderRadius: [4, 4, 0, 0] },
          data: seriesValues(chartData, key.dataKey),
        }
      }
      if (key.type === 'area') {
        return {
          name: key.name || key.dataKey,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 2, color: c },
          itemStyle: { color: c },
          areaStyle: { color: `${c}33` },
          data: seriesValues(chartData, key.dataKey),
        }
      }
      return {
        name: key.name || key.dataKey,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2, color: c },
        itemStyle: { color: c },
        data: seriesValues(chartData, key.dataKey),
      }
    })

    return {
      color: colors,
      grid,
      tooltip,
      legend,
      dataZoom,
      xAxis: categoryAxis,
      yAxis: valueAxis,
      series,
    }
  }

  // default: line
  const lineSeries =
    dataKeys.length > 0
      ? dataKeys.map((key, index) => ({
          name: key.name || key.dataKey,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 2, color: key.color || colors[index % colors.length] },
          itemStyle: { color: key.color || colors[index % colors.length] },
          data: seriesValues(chartData, key.dataKey),
        }))
      : [
          {
            name: seriesName || dataKey,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 2.5, color },
            itemStyle: { color },
            data: seriesValues(chartData, dataKey),
          },
        ]

  return {
    color: colors,
    grid,
    tooltip,
    legend: dataKeys.length > 1 ? legend : showLegend ? legend : undefined,
    dataZoom,
    xAxis: categoryAxis,
    yAxis: valueAxis,
    series: lineSeries,
  }
}
