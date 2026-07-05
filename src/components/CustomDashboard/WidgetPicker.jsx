import React, { useEffect, useMemo, useState } from 'react'
import { FiBarChart2, FiDatabase, FiGrid, FiLayers, FiPlus, FiSearch } from 'react-icons/fi'
import { BUILTIN_WIDGETS, PREDEFINED_REPORT_WIDGETS } from '../../config/builtinWidgets'
import { SYRIA_MAP_WIDGETS } from '../../config/syriaMapWidgets'
import reportBuilderService from '../../services/reportBuilderService'
import govAnalyticsService from '../../services/govAnalyticsService'
import {
  createPredefinedReportWidget,
  createSavedReportWidget,
  createAnalyticsReportWidget,
  createWidgetFromCatalog,
  userHasWidgetPermission,
} from '../../utils/customDashboardUtils'
import { PERMISSIONS } from '../../utils/accessControl'
import { normalizeCatalogItem, unwrapAnalyticsList } from '../../utils/govAnalyticsNormalize'
import { getEntityId, getEntityLabel } from '../../hooks/useGovAnalyticsEntities'
import { useTranslation } from '../../hooks/useTranslation'
import { useAccess } from '../../contexts/AccessContext'
import { useLocale } from '../../contexts/LocaleContext'
import './WidgetPicker.css'

const WidgetPicker = ({ open, onClose, onAdd }) => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const { permissions, roles } = useAccess()
  const [tab, setTab] = useState('builtin')
  const [search, setSearch] = useState('')
  const [savedReports, setSavedReports] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [analyticsCatalog, setAnalyticsCatalog] = useState([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [analyticsEntityId, setAnalyticsEntityId] = useState('')
  const [analyticsEntities, setAnalyticsEntities] = useState([])
  const [analyticsError, setAnalyticsError] = useState(null)

  const canAddAnalytics = userHasWidgetPermission(PERMISSIONS.GOV_DASHBOARD, permissions, roles)
  const canAddPredefined = userHasWidgetPermission(PERMISSIONS.GOV_REPORTS, permissions, roles)
  const canAddSaved = userHasWidgetPermission(PERMISSIONS.GOV_REPORTS_BUILD, permissions, roles)

  useEffect(() => {
    if (!open || tab !== 'saved') return
    let cancelled = false
    setLoadingSaved(true)
    reportBuilderService
      .listSaved()
      .then((res) => {
        if (!cancelled) setSavedReports(Array.isArray(res?.data) ? res.data : [])
      })
      .catch(() => {
        if (!cancelled) setSavedReports([])
      })
      .finally(() => {
        if (!cancelled) setLoadingSaved(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, tab])

  useEffect(() => {
    if (!open || tab !== 'analytics' || !canAddAnalytics) return undefined
    let cancelled = false

    govAnalyticsService
      .getEntities()
      .then((res) => {
        if (cancelled) return
        const entities = unwrapAnalyticsList(res)
        setAnalyticsEntities(entities)
        if (entities.length > 0) {
          setAnalyticsEntityId((prev) => prev || getEntityId(entities[0]))
        }
      })
      .catch(() => {
        if (!cancelled) setAnalyticsEntities([])
      })

    return () => {
      cancelled = true
    }
  }, [open, tab, canAddAnalytics])

  useEffect(() => {
    if (!open || tab !== 'analytics' || !canAddAnalytics) return undefined
    let cancelled = false
    setLoadingAnalytics(true)
    setAnalyticsError(null)

    const params = analyticsEntityId ? { entityId: analyticsEntityId } : {}
    govAnalyticsService
      .getCatalog(params)
      .then((res) => {
        if (cancelled) return
        setAnalyticsCatalog(unwrapAnalyticsList(res).map(normalizeCatalogItem))
      })
      .catch((e) => {
        if (!cancelled) {
          setAnalyticsCatalog([])
          setAnalyticsError(e.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAnalytics(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, tab, canAddAnalytics, analyticsEntityId])

  const builtinItems = useMemo(
    () =>
      [...BUILTIN_WIDGETS, ...SYRIA_MAP_WIDGETS].filter(
        (w) =>
          userHasWidgetPermission(w.permission, permissions, roles) &&
          t(w.labelKey).toLowerCase().includes(search.toLowerCase())
      ),
    [permissions, roles, search, t]
  )

  const reportItems = useMemo(
    () =>
      PREDEFINED_REPORT_WIDGETS.filter(
        (w) =>
          userHasWidgetPermission(w.permission, permissions, roles) &&
          t(w.labelKey).toLowerCase().includes(search.toLowerCase())
      ),
    [permissions, roles, search, t]
  )

  const filteredSaved = useMemo(
    () =>
      savedReports.filter((r) =>
        (r.name || '').toLowerCase().includes(search.toLowerCase())
      ),
    [savedReports, search]
  )

  const filteredAnalytics = useMemo(() => {
    const q = search.toLowerCase()
    return analyticsCatalog.filter((item) => {
      const titleAr = (item.titleAr || '').toLowerCase()
      const titleEn = (item.titleEn || '').toLowerCase()
      return titleAr.includes(q) || titleEn.includes(q) || item.reportId.includes(q)
    })
  }, [analyticsCatalog, search])

  if (!open) return null

  const handleAddBuiltin = (item) => {
    onAdd(createWidgetFromCatalog(item))
    onClose()
  }

  const handleAddReport = (item) => {
    onAdd(createPredefinedReportWidget(item))
    onClose()
  }

  const handleAddSaved = (report) => {
    onAdd(createSavedReportWidget(report))
    onClose()
  }

  const handleAddAnalytics = (item) => {
    onAdd(createAnalyticsReportWidget(item, language))
    onClose()
  }

  return (
    <div className="widget-picker-overlay" onClick={onClose}>
      <div className="widget-picker-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="widget-picker-header">
          <h3>{t('customDashboard.addWidget')}</h3>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>

        <div className="widget-picker-search">
          <FiSearch />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('customDashboard.searchWidgets')}
          />
        </div>

        <div className="widget-picker-tabs">
          <button
            type="button"
            className={tab === 'builtin' ? 'active' : ''}
            onClick={() => setTab('builtin')}
          >
            <FiGrid /> {t('customDashboard.tabBuiltin')}
          </button>
          <button
            type="button"
            className={tab === 'reports' ? 'active' : ''}
            onClick={() => setTab('reports')}
          >
            <FiBarChart2 /> {t('customDashboard.tabReports')}
          </button>
          <button
            type="button"
            className={tab === 'saved' ? 'active' : ''}
            onClick={() => setTab('saved')}
          >
            <FiDatabase /> {t('customDashboard.tabSaved')}
          </button>
          <button
            type="button"
            className={tab === 'analytics' ? 'active' : ''}
            onClick={() => setTab('analytics')}
          >
            <FiLayers /> {t('customDashboard.tabAnalytics')}
          </button>
        </div>

        {tab === 'analytics' && analyticsEntities.length > 0 && (
          <div className="widget-picker-entity-filter">
            <select
              className="filter-select"
              value={analyticsEntityId}
              onChange={(e) => setAnalyticsEntityId(e.target.value)}
            >
              {analyticsEntities.map((entity) => {
                const id = getEntityId(entity)
                const label = getEntityLabel(entity, language)
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        <div className="widget-picker-list">
          {tab === 'builtin' &&
            builtinItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="widget-picker-item"
                onClick={() => handleAddBuiltin(item)}
              >
                <FiPlus />
                <span>{t(item.labelKey)}</span>
              </button>
            ))}

          {tab === 'reports' && !canAddPredefined && (
            <p className="widget-picker-empty">{t('customDashboard.noReportPermission')}</p>
          )}

          {tab === 'reports' && canAddPredefined && reportItems.length === 0 && (
            <p className="widget-picker-empty">{t('customDashboard.noPredefinedReports')}</p>
          )}

          {tab === 'reports' &&
            canAddPredefined &&
            reportItems.map((item) => (
              <button
                key={`${item.categoryId}-${item.reportId}`}
                type="button"
                className="widget-picker-item"
                onClick={() => handleAddReport(item)}
              >
                <FiPlus />
                <span>{t(item.labelKey)}</span>
              </button>
            ))}

          {tab === 'saved' && loadingSaved && (
            <p className="widget-picker-empty">{t('common.loading')}</p>
          )}

          {tab === 'saved' && !loadingSaved && filteredSaved.length === 0 && (
            <p className="widget-picker-empty">{t('customDashboard.noSavedReports')}</p>
          )}

          {tab === 'saved' &&
            !loadingSaved &&
            filteredSaved.map((report) => (
              <button
                key={report.id}
                type="button"
                className="widget-picker-item"
                onClick={() => handleAddSaved(report)}
              >
                <FiPlus />
                <span>{report.name}</span>
              </button>
            ))}

          {tab === 'saved' && !canAddSaved && (
            <p className="widget-picker-empty">{t('customDashboard.noSavedPermission')}</p>
          )}

          {tab === 'analytics' && !canAddAnalytics && (
            <p className="widget-picker-empty">{t('customDashboard.noAnalyticsPermission')}</p>
          )}

          {tab === 'analytics' && canAddAnalytics && analyticsError && (
            <p className="widget-picker-empty widget-picker-error">{analyticsError}</p>
          )}

          {tab === 'analytics' && loadingAnalytics && (
            <p className="widget-picker-empty">{t('common.loading')}</p>
          )}

          {tab === 'analytics' &&
            canAddAnalytics &&
            !loadingAnalytics &&
            !analyticsError &&
            filteredAnalytics.length === 0 && (
            <p className="widget-picker-empty">{t('govAnalytics.noReports')}</p>
          )}

          {tab === 'analytics' &&
            canAddAnalytics &&
            !loadingAnalytics &&
            filteredAnalytics.map((item) => (
              <button
                key={item.reportId}
                type="button"
                className="widget-picker-item"
                onClick={() => handleAddAnalytics(item)}
              >
                <FiPlus />
                <span>
                  {language === 'ar' ? item.titleAr || item.titleEn : item.titleEn || item.titleAr}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}

export default WidgetPicker
