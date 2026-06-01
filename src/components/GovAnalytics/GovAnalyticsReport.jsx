import React from 'react'
import { FiMapPin } from 'react-icons/fi'
import StatCard from '../StatCard/StatCard'
import Chart from '../Chart/Chart'
import Table from '../Table/Table'
import { useTranslation } from '../../hooks/useTranslation'
import './GovAnalyticsReport.css'

const GovAnalyticsReport = ({ data, title, height = 280 }) => {
  const { t } = useTranslation()

  if (!data || data.kind === 'empty') {
    return <div className="gov-analytics-empty">{t('common.noData')}</div>
  }

  if (data.kind === 'kpi') {
    return (
      <div className="gov-analytics-kpi">
        <StatCard title={title} value={data.value} change={data.change} color="success" />
        {data.items?.length > 0 && (
          <ul className="gov-analytics-kpi-items">
            {data.items.map((item, i) => (
              <li key={i}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (data.kind === 'chart' && data.data?.length > 0) {
    return (
      <Chart
        type={data.chartType}
        data={data.data}
        dataKey={data.dataKey}
        dataKeys={data.dataKeys}
        xAxisKey={data.xAxisKey}
        nameKey={data.nameKey}
        title={title}
        height={height}
        scrollable={data.scrollable !== false && data.chartType !== 'pie'}
        pieLabel={data.pieLabel !== false && data.chartType === 'pie'}
      />
    )
  }

  if (data.kind === 'table') {
    return (
      <div className="gov-analytics-table-wrap">
        {title && <h3 className="chart-title">{title}</h3>}
        {data.rows?.length > 0 ? (
          <Table columns={data.columns} data={data.rows} />
        ) : (
          <div className="gov-analytics-empty">{t('common.noData')}</div>
        )}
      </div>
    )
  }

  if (data.kind === 'map') {
    return (
      <div className="gov-analytics-map card">
        {title && <h3 className="chart-title">{title}</h3>}
        {data.points?.length > 0 ? (
          <ul className="gov-analytics-map-list">
            {data.points.map((point, i) => (
              <li key={point.governorateId ?? i}>
                <FiMapPin />
                <span className="map-point-name">{point.name}</span>
                <span className="map-point-value">{point.value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="gov-analytics-empty">{t('common.noData')}</div>
        )}
      </div>
    )
  }

  if (data.kind === 'combo') {
    return (
      <div className="gov-analytics-combo">
        {data.chart?.data?.length > 0 && (
          <Chart
            type={data.chart.chartType}
            data={data.chart.data}
            dataKeys={data.chart.dataKeys}
            xAxisKey={data.chart.xAxisKey}
            title={title}
            height={height}
            scrollable={data.chart.scrollable}
          />
        )}
        {data.table?.rows?.length > 0 && (
          <Table columns={data.table.columns} data={data.table.rows} />
        )}
        {!data.chart?.data?.length && !data.table?.rows?.length && (
          <div className="gov-analytics-empty">{t('common.noData')}</div>
        )}
      </div>
    )
  }

  return <div className="gov-analytics-empty">{t('common.noData')}</div>
}

export default GovAnalyticsReport
