import React from 'react'
import { FiAlertCircle, FiLoader, FiX } from 'react-icons/fi'
import StatCard from '../StatCard/StatCard'
import Chart from '../Chart/Chart'
import { useWidgetData } from '../../hooks/useWidgetData'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../contexts/LocaleContext'
import './DashboardWidget.css'

const DashboardWidget = ({
  widget,
  globalFilters,
  editable = false,
  onRemove,
  title,
}) => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const displayTitle = title || widget.title || (widget.labelKey ? t(widget.labelKey) : '')

  const { data, loading, error } = useWidgetData(widget, globalFilters, {
    language,
    t,
    enabled: !!widget,
  })

  const colSpan = widget.layout?.colSpan || 6
  const rowSpan = widget.layout?.rowSpan || 2

  return (
    <div
      className={`dashboard-widget ${editable ? 'editable' : ''}`}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
    >
      {editable && (
        <div className="widget-toolbar">
          <span className="widget-toolbar-title">{displayTitle}</span>
          {onRemove && (
            <button type="button" className="widget-remove-btn" onClick={() => onRemove(widget.id)} title={t('common.delete')}>
              <FiX />
            </button>
          )}
        </div>
      )}

      <div className="widget-body card">
        {!editable && displayTitle && (
          <h4 className="widget-title">{displayTitle}</h4>
        )}

        {loading && (
          <div className="widget-state">
            <FiLoader className="spin" />
            <span>{t('common.loading')}</span>
          </div>
        )}

        {error && !loading && (
          <div className="widget-state widget-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && data?.kind === 'kpi' && (
          <StatCard
            title={displayTitle}
            value={data.value}
            change={data.change}
            color="success"
          />
        )}

        {!loading && !error && data?.kind === 'overview' && (
          <div className="widget-overview">
            <span className="widget-overview-value">{data.value}</span>
            <span className="widget-overview-detail">{data.detail}</span>
          </div>
        )}

        {!loading && !error && data?.kind === 'chart' && data.data?.length > 0 && (
          <Chart
            type={data.chartType}
            data={data.data}
            dataKey={data.dataKey}
            xAxisKey={data.xAxisKey}
            nameKey={data.nameKey}
            title={editable ? undefined : displayTitle}
            color="#15803d"
            height={rowSpan > 1 ? 240 : 180}
            scrollable={data.data.length > 8}
            pieLabel={data.chartType === 'pie'}
          />
        )}

        {!loading && !error && data?.kind === 'report' && data.chartConfig?.data?.length > 0 && (
          <Chart
            {...data.chartConfig}
            title={editable ? undefined : displayTitle}
            height={240}
          />
        )}

        {!loading && !error && data?.kind === 'saved-report' && data.chartProps?.data?.length > 0 && (
          <Chart
            {...data.chartProps}
            title={editable ? undefined : displayTitle}
            height={240}
          />
        )}

        {!loading && !error && data && !['kpi', 'overview', 'chart', 'report', 'saved-report'].includes(data.kind) && (
          <div className="widget-state">{t('common.noData')}</div>
        )}

        {!loading && !error && data?.kind === 'chart' && !data.data?.length && (
          <div className="widget-state">{t('common.noData')}</div>
        )}
      </div>
    </div>
  )
}

export default DashboardWidget
