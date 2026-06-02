import React, { useCallback, useMemo, useRef, useState } from 'react'
import { FiDatabase, FiLoader, FiPrinter } from 'react-icons/fi'
import Table from '../Table/Table'
import { getCachedAnalyticsReport } from '../../services/govAnalyticsCache'
import { mergeAnalyticsFilters, normalizeGovAnalyticsPayload } from '../../utils/govAnalyticsNormalize'
import { extractTableFromReportData } from '../../utils/reportTableExtract'
import { captureChartFromContainer, printReport } from '../../utils/reportPrint'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../contexts/LocaleContext'
import './ReportWidgetActions.css'

const ReportWidgetActions = ({
  title,
  data,
  widget,
  globalFilters,
  showPrintChartOption = true,
  children,
}) => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const [showData, setShowData] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState(null)
  const [includeChartInPrint, setIncludeChartInPrint] = useState(true)
  const contentRef = useRef(null)

  const mergedData = useMemo(
    () => (detailData ? { ...data, ...detailData } : data),
    [data, detailData]
  )

  const tableData = useMemo(
    () => extractTableFromReportData(mergedData, widget, { language, t }),
    [mergedData, widget, language, t]
  )

  const fetchDetailIfNeeded = useCallback(async () => {
    if (tableData?.rows?.length) return tableData

    const reportId =
      widget?.type === 'analytics-report'
        ? widget.config?.reportId
        : widget?.config?.reportId

    if (!reportId) return tableData

    setLoadingDetail(true)
    setDetailError(null)
    try {
      const filters = mergeAnalyticsFilters(
        globalFilters,
        {
          ...(widget.config?.filters || {}),
          includeDetail: true,
        },
        { reportId }
      )
      const payload = await getCachedAnalyticsReport(reportId, filters)
      const normalized = normalizeGovAnalyticsPayload(payload, language)
      setDetailData(normalized)
      return extractTableFromReportData(
        { ...data, ...normalized },
        widget,
        { language, t }
      )
    } catch (e) {
      setDetailError(e.message)
      return tableData
    } finally {
      setLoadingDetail(false)
    }
  }, [tableData, widget, globalFilters, data, language, t])

  const handleToggleData = async () => {
    if (showData) {
      setShowData(false)
      return
    }
    if (!tableData?.rows?.length) {
      await fetchDetailIfNeeded()
    }
    setShowData(true)
  }

  const handlePrint = async () => {
    let resolved = tableData
    if (!resolved?.rows?.length) {
      resolved = await fetchDetailIfNeeded()
    }

    const chartImageUrl =
      showPrintChartOption && includeChartInPrint
        ? captureChartFromContainer(contentRef.current)
        : null

    printReport({
      title,
      columns: resolved?.columns || [],
      rows: resolved?.rows || [],
      chartImageUrl,
      language,
    })
  }

  const displayTable = showData
    ? tableData ||
      (detailData ? extractTableFromReportData(mergedData, widget, { language, t }) : null)
    : null

  return (
    <div className="report-widget-actions">
      <div className="report-widget-actions-bar">
        <button
          type="button"
          className={`btn btn-outline btn-sm ${showData ? 'active' : ''}`}
          onClick={handleToggleData}
          disabled={loadingDetail}
        >
          {loadingDetail ? <FiLoader className="spin" /> : <FiDatabase />}
          {showData ? t('reportActions.hideData') : t('reportActions.showData')}
        </button>

        <button type="button" className="btn btn-outline btn-sm" onClick={handlePrint}>
          <FiPrinter /> {t('reportActions.print')}
        </button>

        {showPrintChartOption && (
          <label className="print-chart-toggle">
            <input
              type="checkbox"
              checked={includeChartInPrint}
              onChange={(e) => setIncludeChartInPrint(e.target.checked)}
            />
            <span>{t('reportActions.includeChart')}</span>
          </label>
        )}
      </div>

      {detailError && <p className="report-actions-error">{detailError}</p>}

      {showData && displayTable?.rows?.length > 0 && (
        <div className="report-data-panel">
          <Table columns={displayTable.columns} data={displayTable.rows} />
          {mergedData?.detailTable?.totalRows > displayTable.rows.length && (
            <p className="report-data-meta">
              {t('reportActions.showingRows', {
                shown: displayTable.rows.length,
                total: mergedData.detailTable.totalRows,
              })}
            </p>
          )}
        </div>
      )}

      {showData && !loadingDetail && !displayTable?.rows?.length && !detailError && (
        <p className="report-data-empty">{t('reportActions.noTableData')}</p>
      )}

      <div className="report-widget-content" ref={contentRef}>
        {children}
      </div>
    </div>
  )
}

export default ReportWidgetActions
