import React, { useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts'
import './Chart.css'

const COLORS = ['#16a34a', '#22c55e', '#059669', '#65a30d', '#15803d', '#34d399', '#0d9488', '#84cc16', '#4ade80', '#2f855a']

const Chart = ({
  type = 'line',
  data,
  dataKey,
  dataKeys = [],
  xAxisKey,
  nameKey = 'name',
  title,
  color = '#16a34a',
  colors = COLORS,
  height = 300,
  showLegend = true,
  legendPosition = 'bottom',
  yAxisLabel,
  xAxisLabel,
  tooltipFormatter,
  labelFormatter,
  pieLabel = false,
  pieLabelLine = false,
  emptyMessage = null,
  scrollable = false,
  minPointWidth = 48,
}) => {
  const { t } = useTranslation()
  const chartData = Array.isArray(data) ? data : []
  const noDataText = emptyMessage || t('common.noData')

  const useScroll = scrollable && chartData.length > 8
  const innerMinWidth = useScroll
    ? Math.max(chartData.length * minPointWidth, 640)
    : undefined

  const xAxisProps = useMemo(() => {
    const dense = chartData.length > 6
    return {
      dataKey: xAxisKey,
      stroke: '#94a3b8',
      interval: dense ? 0 : 'preserveStartEnd',
      angle: dense ? -35 : 0,
      textAnchor: dense ? 'end' : 'middle',
      height: dense ? 56 : 30,
      tick: { fontSize: 11 },
      label: xAxisLabel
        ? { value: xAxisLabel, position: 'insideBottom', offset: dense ? -8 : -5, style: { fill: '#94a3b8' } }
        : null,
    }
  }, [chartData.length, xAxisKey, xAxisLabel])

  const chartMargin = { top: 8, right: 20, left: yAxisLabel ? 12 : 0, bottom: chartData.length > 6 ? 28 : 8 }

  if (chartData.length === 0) {
    if (!title && !emptyMessage) return null
    return (
      <div className="chart-container card chart-empty">
        {title && <h3 className="chart-title">{title}</h3>}
        <p className="chart-empty-text">{noDataText}</p>
      </div>
    )
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: chartMargin,
    }

    const tooltipStyle = {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '0.5rem',
      color: '#f1f5f9',
    }

    switch (type) {
      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              nameKey={nameKey}
              labelLine={pieLabelLine}
              label={pieLabel ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
              outerRadius={80}
              fill="#16a34a"
              dataKey={dataKey}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
            {showLegend && <Legend />}
          </PieChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis {...xAxisProps} />
            <YAxis
              stroke="#94a3b8"
              label={
                yAxisLabel
                  ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }
                  : null
              }
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={tooltipFormatter}
              labelFormatter={labelFormatter}
            />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis {...xAxisProps} />
            <YAxis
              stroke="#94a3b8"
              label={
                yAxisLabel
                  ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }
                  : null
              }
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={tooltipFormatter}
              labelFormatter={labelFormatter}
            />
            {showLegend && <Legend />}
            {dataKeys.length > 0 ? (
              dataKeys.map((key, index) => (
                <Bar
                  key={key.dataKey}
                  dataKey={key.dataKey}
                  fill={key.color || colors[index % colors.length]}
                  name={key.name || key.dataKey}
                  radius={[8, 8, 0, 0]}
                />
              ))
            ) : (
              <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
            )}
          </BarChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis {...xAxisProps} />
            <YAxis
              stroke="#94a3b8"
              label={
                yAxisLabel
                  ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }
                  : null
              }
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={tooltipFormatter}
              labelFormatter={labelFormatter}
            />
            {showLegend && <Legend />}
            {dataKeys.map((key, index) => {
              if (key.type === 'bar') {
                return (
                  <Bar
                    key={key.dataKey}
                    dataKey={key.dataKey}
                    fill={key.color || colors[index % colors.length]}
                    name={key.name || key.dataKey}
                    radius={[8, 8, 0, 0]}
                  />
                )
              }
              if (key.type === 'line') {
                return (
                  <Line
                    key={key.dataKey}
                    type="monotone"
                    dataKey={key.dataKey}
                    stroke={key.color || colors[index % colors.length]}
                    strokeWidth={2}
                    name={key.name || key.dataKey}
                    dot={{ fill: key.color || colors[index % colors.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )
              }
              if (key.type === 'area') {
                return (
                  <Area
                    key={key.dataKey}
                    type="monotone"
                    dataKey={key.dataKey}
                    stroke={key.color || colors[index % colors.length]}
                    fill={key.color || colors[index % colors.length]}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    name={key.name || key.dataKey}
                  />
                )
              }
              return null
            })}
          </ComposedChart>
        )

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis {...xAxisProps} />
            <YAxis
              stroke="#94a3b8"
              label={
                yAxisLabel
                  ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }
                  : null
              }
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={tooltipFormatter}
              labelFormatter={labelFormatter}
            />
            {showLegend && <Legend />}
            {dataKeys.length > 0 ? (
              dataKeys.map((key, index) => (
                <Line
                  key={key.dataKey}
                  type="monotone"
                  dataKey={key.dataKey}
                  stroke={key.color || colors[index % colors.length]}
                  strokeWidth={2}
                  name={key.name || key.dataKey}
                  dot={{ fill: key.color || colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        )
    }
  }

  const chartBody = (
    <ResponsiveContainer width="100%" height={height} minWidth={innerMinWidth}>
      {renderChart()}
    </ResponsiveContainer>
  )

  return (
    <div className="chart-container card">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className={useScroll ? 'chart-scroll' : 'chart-inner'}>{chartBody}</div>
    </div>
  )
}

export default Chart
