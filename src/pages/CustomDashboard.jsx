import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiEdit3,
  FiLoader,
  FiPlus,
  FiSave,
  FiShare2,
  FiStar,
} from 'react-icons/fi'
import DashboardWidget from '../components/CustomDashboard/DashboardWidget'
import WidgetPicker from '../components/CustomDashboard/WidgetPicker'
import ShareDashboardModal from '../components/CustomDashboard/ShareDashboardModal'
import customDashboardService from '../services/customDashboardService'
import governoratesService from '../services/governoratesService'
import { filterWidgetsByPermission, collectWidgetPermissions } from '../utils/customDashboardUtils'
import { useTranslation } from '../hooks/useTranslation'
import { useAccess } from '../contexts/AccessContext'
import '../components/CustomDashboard/DashboardWidget.css'
import './CustomDashboard.css'

const CustomDashboardPage = ({ mode: modeProp, overrideId }) => {
  const { id: paramId } = useParams()
  const location = useLocation()
  const id = overrideId || paramId
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { permissions, roles } = useAccess()
  const isNew = !overrideId && location.pathname.includes('/custom/new/')
  const isEdit = modeProp === 'edit' || isNew

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [widgets, setWidgets] = useState([])
  const [globalFilters, setGlobalFilters] = useState({ days: 30, governorateId: '' })
  const [governorateOptions, setGovernorateOptions] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [isPrimary, setIsPrimary] = useState(false)

  useEffect(() => {
    governoratesService.getOptions().then(setGovernorateOptions).catch(() => {})
  }, [])

  useEffect(() => {
    if (isNew) {
      setName(t('customDashboard.newDashboard'))
      setDescription('')
      setWidgets([])
      setReadOnly(false)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      customDashboardService.getDashboardById(id),
      customDashboardService.getPrimary(),
    ])
      .then(([dash, primaryRes]) => {
        if (cancelled) return
        if (!dash) {
          setError(t('customDashboard.notFound'))
          return
        }
        setName(dash.name)
        setDescription(dash.description || '')
        setWidgets(dash.widgets || [])
        setGlobalFilters({
          days: dash.globalFilters?.days ?? 30,
          governorateId: dash.globalFilters?.governorateId ?? '',
        })
        setReadOnly(!!dash.readOnly)
        const pid = primaryRes.primaryId || primaryRes.dashboard?.id
        setIsPrimary(pid != null && String(pid) === String(dash.id))
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, isNew, t])

  const visibleWidgets = useMemo(
    () => filterWidgetsByPermission(widgets, permissions, roles),
    [widgets, permissions, roles]
  )

  const handleAddWidget = (widget) => {
    setWidgets((prev) => [...prev, widget])
    setSaved(false)
  }

  const handleRemoveWidget = (widgetId) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId))
    setSaved(false)
  }

  const handleSave = useCallback(async () => {
    setError(null)
    setSaving(true)
    const payload = {
      name,
      description,
      widgets,
      globalFilters: {
        days: globalFilters.days ?? 30,
        governorateId: globalFilters.governorateId || null,
      },
    }
    try {
      if (isNew) {
        const created = await customDashboardService.createDashboard(payload)
        setSaved(true)
        navigate(`/dashboard/custom/${created.id}/edit`, { replace: true })
      } else {
        await customDashboardService.updateDashboard(id, payload)
        setSaved(true)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [isNew, id, name, description, widgets, globalFilters, navigate])

  const handleSetPrimary = async () => {
    setError(null)
    try {
      await customDashboardService.setPrimaryDashboard(id)
      setIsPrimary(true)
      setSaved(true)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleShare = async (userIds) => {
    await customDashboardService.shareDashboard(id, userIds)
  }

  if (loading) {
    return (
      <div className="custom-dashboard-page">
        <div className="widget-state">
          <FiLoader className="spin" />
          <span>{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  if (error && !isNew && !name) {
    return (
      <div className="custom-dashboard-page">
        <div className="error-message card">{error}</div>
        <Link to="/dashboard/my" className="btn btn-outline">
          {t('customDashboard.backToList')}
        </Link>
      </div>
    )
  }

  return (
    <div className="custom-dashboard-page">
      <div className="page-header">
        <div>
          {isEdit ? (
            <>
              <input
                className="dashboard-name-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSaved(false)
                }}
                disabled={readOnly}
                placeholder={t('customDashboard.dashboardName')}
              />
              <input
                className="dashboard-desc-input"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setSaved(false)
                }}
                disabled={readOnly}
                placeholder={t('customDashboard.dashboardDesc')}
              />
            </>
          ) : (
            <>
              <h1 className="page-title">{name}</h1>
              {description && <p className="page-subtitle">{description}</p>}
              {readOnly && (
                <p className="shared-badge">{t('customDashboard.sharedReadOnly')}</p>
              )}
            </>
          )}
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={globalFilters.governorateId || ''}
            onChange={(e) =>
              setGlobalFilters((f) => ({ ...f, governorateId: e.target.value }))
            }
          >
            <option value="">{t('dashboard.allGovernorates')}</option>
            {governorateOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={globalFilters.days ?? 30}
            onChange={(e) =>
              setGlobalFilters((f) => ({ ...f, days: Number(e.target.value) }))
            }
          >
            <option value={7}>{t('dashboard.last7Days')}</option>
            <option value={30}>{t('dashboard.last30Days')}</option>
            <option value={60}>{t('dashboard.last60Days')}</option>
            <option value={90}>{t('dashboard.last90Days')}</option>
            <option value={0}>{t('dashboard.allTimes')}</option>
          </select>

          {!isEdit && !readOnly && (
            <Link to={`/dashboard/custom/${id}/edit`} className="btn btn-outline">
              <FiEdit3 /> {t('common.edit')}
            </Link>
          )}

          {isEdit && !readOnly && (
            <>
              <button type="button" className="btn btn-outline" onClick={() => setPickerOpen(true)}>
                <FiPlus /> {t('customDashboard.addWidget')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                <FiSave /> {saving ? t('common.loading') : saved ? t('customDashboard.saved') : t('common.save')}
              </button>
            </>
          )}

          {!isNew && !readOnly && (
            <>
              <button
                type="button"
                className={`btn ${isPrimary ? 'btn-primary' : 'btn-outline'}`}
                onClick={handleSetPrimary}
                title={t('customDashboard.setPrimary')}
              >
                <FiStar /> {isPrimary ? t('customDashboard.primary') : t('customDashboard.setPrimary')}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShareOpen(true)}>
                <FiShare2 /> {t('customDashboard.share')}
              </button>
            </>
          )}

          {!overrideId && (
            <Link to="/dashboard/my" className="btn btn-outline">
              <FiArrowLeft /> {t('customDashboard.myDashboards')}
            </Link>
          )}
        </div>
      </div>

      {error && <div className="error-message card">{error}</div>}

      {visibleWidgets.length === 0 ? (
        <div className="custom-dashboard-empty card">
          <p>{t('customDashboard.emptyDashboard')}</p>
          {isEdit && !readOnly && (
            <button type="button" className="btn btn-primary" onClick={() => setPickerOpen(true)}>
              <FiPlus /> {t('customDashboard.addFirstWidget')}
            </button>
          )}
        </div>
      ) : (
        <div className="custom-dashboard-grid">
          {visibleWidgets.map((widget) => (
            <DashboardWidget
              key={widget.id}
              widget={widget}
              globalFilters={globalFilters}
              editable={isEdit && !readOnly}
              onRemove={handleRemoveWidget}
            />
          ))}
        </div>
      )}

      <WidgetPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onAdd={handleAddWidget} />

      <ShareDashboardModal
        open={shareOpen}
        dashboard={{
          id,
          name,
          requiredPermissions: collectWidgetPermissions(widgets),
        }}
        onClose={() => setShareOpen(false)}
        onShare={handleShare}
      />
    </div>
  )
}

export default CustomDashboardPage
