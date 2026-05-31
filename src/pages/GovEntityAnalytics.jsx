import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { FiBarChart2, FiLoader, FiRefreshCw } from 'react-icons/fi'
import GovAnalyticsReport from '../components/GovAnalytics/GovAnalyticsReport'
import ReportWidgetActions from '../components/ReportActions/ReportWidgetActions'
import govAnalyticsService from '../services/govAnalyticsService'
import governoratesService from '../services/governoratesService'
import {
  mergeAnalyticsFilters,
  normalizeGovAnalyticsPayload,
  unwrapAnalyticsList,
  unwrapAnalyticsReport,
} from '../utils/govAnalyticsNormalize'
import {
  useGovAnalyticsEntities,
  getEntityId,
  getEntityLabel,
} from '../hooks/useGovAnalyticsEntities'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../contexts/LocaleContext'
import './GovEntityAnalytics.css'

const PERIOD_OPTIONS = [
  { value: 7, labelKey: 'govAnalytics.last7Days' },
  { value: 30, labelKey: 'govAnalytics.last30Days' },
  { value: 90, labelKey: 'govAnalytics.last90Days' },
  { value: 365, labelKey: 'govAnalytics.lastYear' },
]

const VIZ_ICONS = {
  kpi: '📊',
  column: '📶',
  line: '📈',
  donut: '🍩',
  table: '📋',
  map: '🗺️',
  combo: '🔀',
}

const GovEntityAnalytics = () => {
  const { entityId: routeEntityId } = useParams()
  const { t } = useTranslation()
  const { language } = useLocale()
  const { entities, loading: loadingEntities } = useGovAnalyticsEntities({ enabled: true })

  const activeEntityId = routeEntityId || ''
  const activeEntity = useMemo(
    () => entities.find((e) => getEntityId(e) === activeEntityId),
    [entities, activeEntityId]
  )

  const [catalog, setCatalog] = useState([])
  const [activeReportId, setActiveReportId] = useState('')
  const [reportData, setReportData] = useState(null)
  const [filters, setFilters] = useState({ days: 30, governorateId: '', granularity: 'day' })
  const [governorateOptions, setGovernorateOptions] = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    governoratesService.getOptions().then(setGovernorateOptions).catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeEntityId) return undefined
    let cancelled = false
    setLoadingCatalog(true)
    setError(null)
    setActiveReportId('')
    setReportData(null)

    govAnalyticsService
      .getCatalog({ entityId: activeEntityId })
      .then((res) => {
        if (cancelled) return
        const list = unwrapAnalyticsList(res)
        setCatalog(list)
        if (list.length > 0) setActiveReportId(list[0].reportId)
      })
      .catch((e) => {
        if (!cancelled) {
          setCatalog([])
          setError(e.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeEntityId])

  const loadReport = useCallback(async () => {
    if (!activeReportId) return
    setLoadingReport(true)
    setError(null)
    try {
      const query = mergeAnalyticsFilters(filters, {})
      const res = await govAnalyticsService.getReport(activeReportId, query)
      setReportData(unwrapAnalyticsReport(res))
    } catch (e) {
      setError(e.message)
      setReportData(null)
    } finally {
      setLoadingReport(false)
    }
  }, [activeReportId, filters])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const activeCatalogItem = useMemo(
    () => catalog.find((item) => item.reportId === activeReportId),
    [catalog, activeReportId]
  )

  const normalizedReport = useMemo(
    () => (reportData ? normalizeGovAnalyticsPayload(reportData, language) : null),
    [reportData, language]
  )

  const reportTitle = useMemo(() => {
    if (activeCatalogItem) {
      return language === 'ar'
        ? activeCatalogItem.titleAr || activeCatalogItem.titleEn
        : activeCatalogItem.titleEn || activeCatalogItem.titleAr
    }
    if (reportData) {
      return language === 'ar'
        ? reportData.titleAr || reportData.titleEn
        : reportData.titleEn || reportData.titleAr
    }
    return ''
  }, [activeCatalogItem, reportData, language])

  const entityTitle = getEntityLabel(activeEntity, language)

  const showGovernorateFilter =
    activeCatalogItem?.supportedFilters?.includes('governorateId') ||
    activeEntityId === 'governorate'

  const showGranularityFilter =
    activeCatalogItem?.visualizationType === 'line' ||
    activeCatalogItem?.supportedFilters?.includes('granularity')

  if (loadingEntities) {
    return (
      <div className="gov-entity-analytics-page">
        <div className="gov-analytics-loading card">
          <FiLoader className="spin" /> {t('common.loading')}
        </div>
      </div>
    )
  }

  if (!loadingEntities && entities.length > 0 && !activeEntity) {
    return <Navigate to={`/gov/entity-analytics/${getEntityId(entities[0])}`} replace />
  }

  if (!activeEntityId) {
    return (
      <div className="gov-entity-analytics-page">
        <div className="gov-analytics-loading card">
          <p>{t('govAnalytics.selectEntity')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="gov-entity-analytics-page">
      <div className="page-header">
        <div>
          <p className="entity-breadcrumb">{t('nav.entityAnalytics')}</p>
          <h1 className="page-title">{entityTitle}</h1>
          <p className="page-subtitle">{t('govAnalytics.entitySubtitle')}</p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={loadReport}
          disabled={loadingReport || !activeReportId}
        >
          <FiRefreshCw className={loadingReport ? 'spin' : ''} /> {t('common.refresh')}
        </button>
      </div>

      <div className="gov-analytics-layout">
        <aside className="catalog-panel card">
          <h3 className="panel-title">{t('govAnalytics.reportCatalog')}</h3>
          {loadingCatalog && (
            <div className="panel-loading">
              <FiLoader className="spin" />
            </div>
          )}
          {!loadingCatalog && catalog.length === 0 && (
            <p className="panel-empty">{t('govAnalytics.noReports')}</p>
          )}
          <div className="catalog-list">
            {catalog.map((item) => (
              <button
                key={item.reportId}
                type="button"
                className={`catalog-item ${activeReportId === item.reportId ? 'active' : ''}`}
                onClick={() => setActiveReportId(item.reportId)}
              >
                <span className="catalog-item-icon">
                  {VIZ_ICONS[item.visualizationType] || <FiBarChart2 />}
                </span>
                <span className="catalog-item-text">
                  {language === 'ar' ? item.titleAr || item.titleEn : item.titleEn || item.titleAr}
                </span>
                <span className="catalog-item-type">
                  {t(`govAnalytics.vizTypes.${item.visualizationType}`, item.visualizationType)}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="report-panel card">
          {!activeReportId ? (
            <div className="report-placeholder">
              <FiBarChart2 size={48} />
              <p>{t('govAnalytics.selectReport')}</p>
            </div>
          ) : (
            <>
              <div className="report-panel-header">
                <h2>{reportTitle}</h2>
                {activeCatalogItem?.isShared && (
                  <span className="shared-badge">{t('govAnalytics.shared')}</span>
                )}
              </div>

              <div className="report-filters">
                <div className="filter-group">
                  <label>{t('govAnalytics.period')}</label>
                  <select
                    className="filter-select"
                    value={filters.days}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, days: Number(e.target.value) }))
                    }
                  >
                    {PERIOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                {showGovernorateFilter && (
                  <div className="filter-group">
                    <label>{t('dashboard.governorate')}</label>
                    <select
                      className="filter-select"
                      value={filters.governorateId}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, governorateId: e.target.value }))
                      }
                    >
                      <option value="">{t('common.all')}</option>
                      {governorateOptions.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {showGranularityFilter && (
                  <div className="filter-group">
                    <label>{t('analytics.groupBy')}</label>
                    <select
                      className="filter-select"
                      value={filters.granularity}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, granularity: e.target.value }))
                      }
                    >
                      <option value="day">{t('analytics.daily')}</option>
                      <option value="week">{t('analytics.weekly')}</option>
                      <option value="month">{t('analytics.monthly')}</option>
                    </select>
                  </div>
                )}
              </div>

              {error && (
                <div className="report-error">
                  <p>{error}</p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={loadReport}>
                    {t('reports.retry')}
                  </button>
                </div>
              )}

              {loadingReport && (
                <div className="report-loading">
                  <FiLoader className="spin" /> {t('reports.loadingReportData')}
                </div>
              )}

              {!loadingReport && !error && normalizedReport && (
                <ReportWidgetActions
                  title={reportTitle}
                  data={normalizedReport}
                  widget={{
                    type: 'analytics-report',
                    config: { reportId: activeReportId, filters: {} },
                  }}
                  globalFilters={filters}
                  showPrintChartOption={
                    normalizedReport.kind === 'chart' ||
                    normalizedReport.kind === 'combo' ||
                    normalizedReport.kind === 'donut'
                  }
                >
                  <GovAnalyticsReport data={normalizedReport} height={360} />
                </ReportWidgetActions>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default GovEntityAnalytics
