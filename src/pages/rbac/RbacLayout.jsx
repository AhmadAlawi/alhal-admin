import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import './Rbac.css'

const RbacLayout = () => {
  const { t } = useTranslation()

  const tabs = [
    { to: '/rbac/permissions', label: t('rbac.permissionsTab') },
    { to: '/rbac/roles', label: t('rbac.rolesTab') },
    { to: '/rbac/users', label: t('rbac.usersTab') },
  ]

  return (
    <div className="rbac-page">
      <div className="rbac-header">
        <h1>{t('nav.rbac')}</h1>
        <p className="text-muted">{t('rbac.subtitle')}</p>
      </div>
      <nav className="rbac-tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `rbac-tab ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}

export default RbacLayout
