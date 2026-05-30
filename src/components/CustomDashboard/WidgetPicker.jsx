import React, { useEffect, useMemo, useState } from 'react'
import { FiBarChart2, FiDatabase, FiGrid, FiPlus, FiSearch } from 'react-icons/fi'
import { BUILTIN_WIDGETS, PREDEFINED_REPORT_WIDGETS } from '../../config/builtinWidgets'
import reportBuilderService from '../../services/reportBuilderService'
import {
  createPredefinedReportWidget,
  createSavedReportWidget,
  createWidgetFromCatalog,
  userHasWidgetPermission,
} from '../../utils/customDashboardUtils'
import { useTranslation } from '../../hooks/useTranslation'
import { useAccess } from '../../contexts/AccessContext'
import './WidgetPicker.css'

const WidgetPicker = ({ open, onClose, onAdd }) => {
  const { t } = useTranslation()
  const { permissions, roles } = useAccess()
  const [tab, setTab] = useState('builtin')
  const [search, setSearch] = useState('')
  const [savedReports, setSavedReports] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)

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

  const builtinItems = useMemo(
    () =>
      BUILTIN_WIDGETS.filter(
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
        </div>

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

          {tab === 'reports' &&
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
        </div>
      </div>
    </div>
  )
}

export default WidgetPicker
