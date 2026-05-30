import React, { useMemo, useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../contexts/LocaleContext'
import { buildChartOption, CHART_COLORS } from './echartsOptions'
import { getCompatibleChartTypes, resolveChartKeys } from './chartTypeUtils'
import './Chart.css'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
])

const Chart = ({
  type = 'line',
  data,
  dataKey,
  dataKeys = [],
  xAxisKey,
  nameKey = 'name',
  title,
  color = '#15803d',
  colors = CHART_COLORS,
  height = 300,
  showLegend = true,
  legendPosition = 'bottom',
  yAxisLabel,
  xAxisLabel,
  tooltipFormatter,
  labelFormatter,
  pieLabel = false,
  pieLabelLine = false,
  seriesName,
  emptyMessage = null,
  scrollable = false,
  minPointWidth = 48,
  allowTypeChange = true,
}) => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const chartData = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const noDataText = emptyMessage || t('common.noData')
  const isRtl = language === 'ar'

  const compatibleTypes = useMemo(
    () =>
      getCompatibleChartTypes({
        type,
        dataKeys,
        xAxisKey,
        nameKey,
        dataKey,
      }),
    [type, dataKeys, xAxisKey, nameKey, dataKey]
  )

  const [activeType, setActiveType] = useState(type)

  useEffect(() => {
    setActiveType(type)
  }, [type, chartData])

  const showTypeSwitcher = allowTypeChange && compatibleTypes.length > 1
  const renderType = showTypeSwitcher ? activeType : type

  const resolvedKeys = useMemo(
    () => resolveChartKeys(renderType, { xAxisKey, nameKey, dataKey }),
    [renderType, xAxisKey, nameKey, dataKey]
  )

  const useScroll = scrollable && chartData.length > 8 && renderType !== 'pie'
  const innerMinWidth = useScroll
    ? Math.max(chartData.length * minPointWidth, 640)
    : undefined

  const option = useMemo(
    () =>
      buildChartOption({
        type: renderType,
        data: chartData,
        dataKey: resolvedKeys.dataKey,
        dataKeys: renderType === 'composed' ? dataKeys : renderType === 'pie' ? [] : dataKeys,
        xAxisKey: resolvedKeys.xAxisKey,
        nameKey: resolvedKeys.nameKey,
        color,
        colors,
        showLegend,
        legendPosition,
        yAxisLabel,
        xAxisLabel,
        tooltipFormatter,
        labelFormatter,
        pieLabel: pieLabel || pieLabelLine || renderType === 'pie',
        seriesName,
        scrollable: useScroll,
        isRtl,
      }),
    [
      renderType,
      chartData,
      resolvedKeys,
      dataKeys,
      color,
      colors,
      showLegend,
      legendPosition,
      yAxisLabel,
      xAxisLabel,
      tooltipFormatter,
      labelFormatter,
      pieLabel,
      pieLabelLine,
      seriesName,
      useScroll,
      isRtl,
    ]
  )

  if (chartData.length === 0) {
    if (!title && !emptyMessage) return null
    return (
      <div className="chart-container card chart-empty">
        {title && <h3 className="chart-title">{title}</h3>}
        <p className="chart-empty-text">{noDataText}</p>
      </div>
    )
  }

  return (
    <div className="chart-container card">
      {(title || showTypeSwitcher) && (
        <div className="chart-header">
          {title && <h3 className="chart-title">{title}</h3>}
          {showTypeSwitcher && (
            <div
              className="chart-type-switcher"
              role="group"
              aria-label={t('chart.changeType')}
            >
              {compatibleTypes.map((chartType) => (
                <button
                  key={chartType}
                  type="button"
                  className={`chart-type-switcher-btn ${renderType === chartType ? 'active' : ''}`}
                  onClick={() => setActiveType(chartType)}
                  aria-pressed={renderType === chartType}
                >
                  {t(`reportBuilder.chartTypes.${chartType}`)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className={useScroll ? 'chart-scroll' : 'chart-inner'}>
        <ReactECharts
          echarts={echarts}
          option={option}
          style={{
            height: `${height}px`,
            width: useScroll ? innerMinWidth : '100%',
            minHeight: `${height}px`,
          }}
          opts={{ renderer: 'canvas' }}
          notMerge
          lazyUpdate
        />
      </div>
    </div>
  )
}

export default Chart
