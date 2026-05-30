import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiCopy,
  FiEdit3,
  FiEye,
  FiLoader,
  FiPlus,
  FiStar,
  FiTrash2,
} from 'react-icons/fi'
import customDashboardService from '../services/customDashboardService'
import { useTranslation } from '../hooks/useTranslation'
import { useAccess } from '../contexts/AccessContext'
import './CustomDashboard.css'

const MyDashboards = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { permissions, roles } = useAccess()
  const [dashboards, setDashboards] = useState([])
  const [primaryId, setPrimaryId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, primaryRes] = await Promise.all([
        customDashboardService.listAccessibleDashboards(null, permissions, roles),
        customDashboardService.getPrimary(),
      ])
      setDashboards(list)
      setPrimaryId(primaryRes.primaryId || primaryRes.dashboard?.id || null)
    } catch (e) {
      setError(e.message)
      setDashboards([])
    } finally {
      setLoading(false)
    }
  }, [permissions, roles])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id) => {
    if (!window.confirm(t('customDashboard.confirmDelete'))) return
    try {
      await customDashboardService.deleteDashboard(id)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSetPrimary = async (id) => {
    try {
      await customDashboardService.setPrimaryDashboard(id)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDuplicate = async (id) => {
    try {
      const copy = await customDashboardService.duplicateDashboard(id)
      navigate(`/dashboard/custom/${copy.id}/edit`)
    } catch (e) {
      setError(e.message)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString()
  }

  return (
    <div className="custom-dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('customDashboard.myDashboards')}</h1>
          <p className="page-subtitle">{t('customDashboard.myDashboardsSubtitle')}</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn btn-outline">
            {t('customDashboard.systemDashboard')}
          </Link>
          <Link to="/dashboard/custom/new/edit" className="btn btn-primary">
            <FiPlus /> {t('customDashboard.createDashboard')}
          </Link>
        </div>
      </div>

      {error && <div className="error-message card">{error}</div>}

      {loading ? (
        <div className="widget-state">
          <FiLoader className="spin" />
          <span>{t('common.loading')}</span>
        </div>
      ) : dashboards.length === 0 ? (
        <div className="custom-dashboard-empty card">
          <p>{t('customDashboard.noDashboardsYet')}</p>
          <Link to="/dashboard/custom/new/edit" className="btn btn-primary">
            <FiPlus /> {t('customDashboard.createFirst')}
          </Link>
        </div>
      ) : (
        <div className="my-dashboards-grid">
          {dashboards.map((dash) => {
            const isPrimary = primaryId && String(primaryId) === String(dash.id)
            return (
              <div key={dash.id} className="dashboard-card card">
                <div className="dashboard-card-header">
                  <h3>{dash.name}</h3>
                  <div className="dashboard-card-badges">
                    {isPrimary && (
                      <span className="dashboard-card-badge primary">
                        {t('customDashboard.primary')}
                      </span>
                    )}
                    {dash.isShared && (
                      <span className="dashboard-card-badge shared">
                        {t('customDashboard.shared')}
                      </span>
                    )}
                  </div>
                </div>
                {dash.description && (
                  <p className="dashboard-card-meta">{dash.description}</p>
                )}
                <p className="dashboard-card-meta">
                  {dash.widgets?.length || 0} {t('customDashboard.widgetCount')} ·{' '}
                  {formatDate(dash.updatedAt)}
                  {dash.sharedFrom && ` · ${t('customDashboard.from')} ${dash.sharedFrom}`}
                </p>
                <div className="dashboard-card-actions">
                  <Link to={`/dashboard/custom/${dash.id}`} className="btn btn-primary">
                    <FiEye /> {t('common.view')}
                  </Link>
                  {!dash.readOnly && (
                    <>
                      <Link to={`/dashboard/custom/${dash.id}/edit`} className="btn btn-outline">
                        <FiEdit3 /> {t('common.edit')}
                      </Link>
                      {!isPrimary && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleSetPrimary(dash.id)}
                        >
                          <FiStar /> {t('customDashboard.setPrimary')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleDuplicate(dash.id)}
                      >
                        <FiCopy /> {t('customDashboard.duplicate')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleDelete(dash.id)}
                      >
                        <FiTrash2 /> {t('common.delete')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyDashboards
