import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { FiBarChart2, FiLoader, FiRefreshCw } from 'react-icons/fi'
import GovAnalyticsReport from '../components/GovAnalytics/GovAnalyticsReport'
import GovAnalyticsFilterBar from '../components/GovAnalytics/GovAnalyticsFilterBar'
import { resolveReportTitle } from '../utils/govAnalyticsFilterConfig'
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

const DEFAULT_FILTERS = {
  days: 30,
  governorateId: '',
  fromGovernorateId: '',
  toGovernorateId: '',
  areaId: '',
  categoryId: '',
  productId: '',
  granularity: 'day',
  userRole: '',
  saleType: '',
}

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
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [governorateOptions, setGovernorateOptions] = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    governoratesService.getOptions(language).then(setGovernorateOptions).catch(() => {})
  }, [language])

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
      const query = mergeAnalyticsFilters(filters, {}, { reportId: activeReportId })
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

  useEffect(() => {
    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      days: prev.days,
      granularity: prev.granularity,
      governorateId: activeEntityId === 'governorate' ? prev.governorateId : '',
    }))
  }, [activeReportId, activeEntityId])

  const activeCatalogItem = useMemo(
    () => catalog.find((item) => item.reportId === activeReportId),
    [catalog, activeReportId]
  )

  const governorateLookup = useMemo(() => {
    const byId = new Map()
    governorateOptions.forEach((g) => {
      if (g.id != null) byId.set(String(g.id), g)
    })
    return byId
  }, [governorateOptions])

  const normalizedReport = useMemo(
    () =>
      reportData
        ? normalizeGovAnalyticsPayload(reportData, language, { governorateLookup })
        : null,
    [reportData, language, governorateLookup]
  )

  const reportTitle = useMemo(
    () => resolveReportTitle(activeCatalogItem, reportData, language),
    [activeCatalogItem, reportData, language]
  )

  const entityTitle = getEntityLabel(activeEntity, language)

  const governorateFilterRequired =
    activeEntityId === 'governorate' &&
    (activeReportId?.includes('summary') ||
      activeCatalogItem?.supportedFilters?.includes('governorateId'))

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

              <GovAnalyticsFilterBar
                catalogItem={activeCatalogItem}
                reportId={activeReportId}
                entityId={activeEntityId}
                filters={filters}
                onChange={setFilters}
                governorateOptions={governorateOptions}
              />

              {governorateFilterRequired && !filters.governorateId && (
                <div className="report-error">
                  <p>{t('govAnalytics.governorateRequired')}</p>
                </div>
              )}

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

              {!loadingReport &&
                !error &&
                normalizedReport &&
                !(governorateFilterRequired && !filters.governorateId) && (
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
