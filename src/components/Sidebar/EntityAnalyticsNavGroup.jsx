import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FiLayers, FiLoader } from 'react-icons/fi'
import { useTranslation } from '../../hooks/useTranslation'
import { useGovAnalyticsEntities, getEntityId, getEntityLabel } from '../../hooks/useGovAnalyticsEntities'

const EntityAnalyticsNavGroup = () => {
  const { t, language } = useTranslation()
  const location = useLocation()
  const { entities, loading } = useGovAnalyticsEntities({ enabled: true })

  const isInSection = location.pathname.startsWith('/gov/entity-analytics')

  return (
    <li className="menu-group entity-analytics-group">
      <div className={`menu-group-header ${isInSection ? 'active-section' : ''}`}>
        <FiLayers className="menu-group-icon" />
        <span>{t('nav.entityAnalytics')}</span>
      </div>
      <ul className="menu-sub-list">
        {loading && (
          <li className="menu-sub-loading">
            <FiLoader className="spin" />
            <span>{t('common.loading')}</span>
          </li>
        )}
        {!loading && entities.length === 0 && (
          <li className="menu-sub-empty">{t('govAnalytics.noEntities')}</li>
        )}
        {!loading &&
          entities.map((entity) => {
            const id = getEntityId(entity)
            const to = `/gov/entity-analytics/${id}`
            return (
              <li key={id}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `menu-item menu-sub-item ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="menu-label">{getEntityLabel(entity, language)}</span>
                  {(entity.reportCount ?? entity.ReportCount) != null && (
                    <span className="menu-sub-count">{entity.reportCount ?? entity.ReportCount}</span>
                  )}
                </NavLink>
              </li>
            )
          })}
      </ul>
    </li>
  )
}

export default EntityAnalyticsNavGroup
