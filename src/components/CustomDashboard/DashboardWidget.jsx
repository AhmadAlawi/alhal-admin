import React from 'react'

import { FiAlertCircle, FiLoader, FiX } from 'react-icons/fi'

import StatCard from '../StatCard/StatCard'

import Chart from '../Chart/Chart'

import GovAnalyticsReport from '../GovAnalytics/GovAnalyticsReport'

import SyriaMap from '../SyriaMap/SyriaMap'

import ReportWidgetActions from '../ReportActions/ReportWidgetActions'

import { useWidgetData } from '../../hooks/useWidgetData'

import { useTranslation } from '../../hooks/useTranslation'

import { useLocale } from '../../contexts/LocaleContext'

import './DashboardWidget.css'



const REPORT_WIDGET_TYPES = new Set([

  'predefined-report',

  'saved-report',

  'analytics-report',

])



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
    enabled: !!widget,
  })



  const colSpan = widget.layout?.colSpan || 6

  const rowSpan = widget.layout?.rowSpan || 2

  const isReportWidget = REPORT_WIDGET_TYPES.has(widget.type)



  const hasChartContent =

    (data?.kind === 'chart' && data.data?.length > 0) ||

    (data?.kind === 'report' && data.chartConfig?.data?.length > 0) ||

    (data?.kind === 'saved-report' && data.chartProps?.data?.length > 0) ||

    (data?.kind === 'combo' && data.chart?.data?.length > 0)



  const renderBody = () => {

    if (loading) {

      return (

        <div className="widget-state">

          <FiLoader className="spin" />

          <span>{t('common.loading')}</span>

        </div>

      )

    }



    if (error) {

      return (

        <div className="widget-state widget-error">

          <FiAlertCircle />

          <span>{error}</span>

        </div>

      )

    }



    if (widget.type === 'builtin-kpi' && data?.kind === 'kpi') {

      return (

        <StatCard

          title={displayTitle}

          value={data.value}

          change={data.change}

          color="success"

        />

      )

    }



    if (widget.type === 'builtin-overview' && data?.kind === 'overview') {

      return (

        <div className="widget-overview">

          <span className="widget-overview-value">{data.value}</span>

          <span className="widget-overview-detail">{data.detail}</span>

        </div>

      )

    }



    if (widget.type === 'builtin-chart' && data?.kind === 'chart' && data.data?.length > 0) {

      return (

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

      )

    }



    if (widget.type === 'builtin-chart' && data?.kind === 'chart' && !data.data?.length) {

      return <div className="widget-state">{t('common.noData')}</div>

    }



    if (widget.type === 'syria-map' && data?.kind === 'syria-map') {

      return (

        <SyriaMap

          data={data.payload}

          mapKind={data.mapKind}

          height={rowSpan > 2 ? 360 : 280}

          language={language}

        />

      )

    }



    if (isReportWidget && data) {

      const reportContent = (

        <>

          {widget.type === 'predefined-report' && data.kind === 'report' && data.chartConfig?.data?.length > 0 && (

            <Chart

              {...data.chartConfig}

              title={editable ? undefined : displayTitle}

              height={240}

            />

          )}



          {widget.type === 'predefined-report' && data.kind === 'report' && !data.chartConfig?.data?.length && (
            <p className="widget-chart-hint">{t('reportActions.useShowData')}</p>
          )}



          {widget.type === 'saved-report' && data.kind === 'saved-report' && data.chartProps?.data?.length > 0 && (

            <Chart

              {...data.chartProps}

              title={editable ? undefined : displayTitle}

              height={240}

            />

          )}



          {widget.type === 'saved-report' && data.kind === 'saved-report' && !data.chartProps?.data?.length && (
            <p className="widget-chart-hint">{t('reportActions.useShowData')}</p>
          )}



          {widget.type === 'analytics-report' && (

            <GovAnalyticsReport

              data={data}

              title={editable ? undefined : displayTitle}

              height={rowSpan > 1 ? 240 : 180}

            />

          )}

        </>

      )



      return (

        <ReportWidgetActions

          title={displayTitle}

          data={data}

          widget={widget}

          globalFilters={globalFilters}

          showPrintChartOption={hasChartContent}

        >

          {reportContent}

        </ReportWidgetActions>

      )

    }



    if (data && !['kpi', 'overview', 'chart'].includes(data.kind)) {

      return <div className="widget-state">{t('common.noData')}</div>

    }



    return null

  }



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

        {!editable && displayTitle && !isReportWidget && widget.type !== 'syria-map' && (

          <h4 className="widget-title">{displayTitle}</h4>

        )}

        {renderBody()}

      </div>

    </div>

  )

}



export default DashboardWidget


