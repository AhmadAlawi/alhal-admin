import React from 'react'
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
  ComposedChart
} from 'recharts'
import './Chart.css'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16']

const Chart = ({ 
  type = 'line', 
  data, 
  dataKey, 
  dataKeys = [], // For multi-line/multi-bar charts
  xAxisKey, 
  title, 
  color = '#6366f1',
  colors = COLORS,
  height = 300,
  showLegend = true,
  legendPosition = 'bottom',
  yAxisLabel,
  xAxisLabel,
  tooltipFormatter,
  labelFormatter,
  pieLabel = false,
  pieLabelLine = false
}) => {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 20, left: 0, bottom: 5 }
    }

    const tooltipStyle = {
      backgroundColor: '#1e293b', 
      border: '1px solid #334155',
      borderRadius: '0.5rem',
      color: '#f1f5f9'
    }

    switch (type) {
      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={pieLabelLine}
              label={pieLabel ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data && data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={tooltipStyle}
              formatter={tooltipFormatter}
            />
            {showLegend && <Legend />}
          </PieChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#94a3b8"
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, style: { fill: '#94a3b8' } } : null}
            />
            <YAxis 
              stroke="#94a3b8"
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } } : null}
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
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#94a3b8"
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, style: { fill: '#94a3b8' } } : null}
            />
            <YAxis 
              stroke="#94a3b8"
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } } : null}
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
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#94a3b8"
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, style: { fill: '#94a3b8' } } : null}
            />
            <YAxis 
              stroke="#94a3b8"
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } } : null}
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
              } else if (key.type === 'line') {
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
              } else if (key.type === 'area') {
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

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#94a3b8"
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, style: { fill: '#94a3b8' } } : null}
            />
            <YAxis 
              stroke="#94a3b8"
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } } : null}
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

  return (
    <div className="chart-container card">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

export default Chart

