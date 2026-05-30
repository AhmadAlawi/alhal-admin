import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiGrid, FiLayout, FiLoader, FiSettings } from 'react-icons/fi'
import Dashboard from './Dashboard'
import CustomDashboardPage from './CustomDashboard'
import customDashboardService from '../services/customDashboardService'
import { useTranslation } from '../hooks/useTranslation'
import './CustomDashboard.css'

/**
 * Entry point for /dashboard — loads primary custom layout from API, else system dashboard.
 */
const DashboardHub = () => {
  const { t } = useTranslation()
  const [primary, setPrimary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('system')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    customDashboardService
      .resolvePrimaryDashboard()
      .then((dash) => {
        if (cancelled) return
        setPrimary(dash)
        setView(dash ? 'custom' : 'system')
      })
      .catch(() => {
        if (!cancelled) {
          setPrimary(null)
          setView('system')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="widget-state" style={{ minHeight: 200 }}>
        <FiLoader className="spin" />
        <span>{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <div>
      <div className="dashboard-hub-bar">
        <div className="dashboard-hub-bar-left">
          <span className="dashboard-hub-label">{t('customDashboard.viewing')}:</span>
          <button
            type="button"
            className={`btn ${view === 'custom' && primary ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => primary && setView('custom')}
            disabled={!primary}
            title={!primary ? t('customDashboard.noPrimaryHint') : undefined}
          >
            <FiLayout /> {primary ? primary.name : t('customDashboard.noPrimary')}
          </button>
          <button
            type="button"
            className={`btn ${view === 'system' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('system')}
          >
            <FiGrid /> {t('customDashboard.systemDashboard')}
          </button>
        </div>
        <Link to="/dashboard/my" className="btn btn-outline">
          <FiSettings /> {t('customDashboard.manageDashboards')}
        </Link>
      </div>

      {view === 'custom' && primary ? (
        <CustomDashboardPage mode="view" overrideId={primary.id} />
      ) : (
        <Dashboard />
      )}
    </div>
  )
}

export default DashboardHub
