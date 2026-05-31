import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { FiLoader } from 'react-icons/fi'
import { useGovAnalyticsEntities, getEntityId } from '../hooks/useGovAnalyticsEntities'
import { useTranslation } from '../hooks/useTranslation'

const EntityAnalyticsRedirect = () => {
  const { t } = useTranslation()
  const { entities, loading } = useGovAnalyticsEntities({ enabled: true })

  if (loading) {
    return (
      <div className="gov-analytics-loading card">
        <FiLoader className="spin" /> {t('common.loading')}
      </div>
    )
  }

  const firstId = getEntityId(entities[0])
  if (firstId) {
    return <Navigate to={`/gov/entity-analytics/${firstId}`} replace />
  }

  return (
    <div className="gov-analytics-loading card">
      <p>{t('govAnalytics.noEntities')}</p>
    </div>
  )
}

export default EntityAnalyticsRedirect
