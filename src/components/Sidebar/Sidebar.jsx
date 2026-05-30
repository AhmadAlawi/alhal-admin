import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  FiHome,
  FiLayout,
  FiUsers,
  FiBarChart2,
  FiShoppingBag,
  FiFolder,
  FiShoppingCart,
  FiSettings,
  FiX,
  FiDatabase,
  FiAlertCircle,
  FiMessageSquare,
  FiStar,
  FiTruck,
  FiPackage,
  FiDollarSign,
  FiImage,
  FiSmartphone,
  FiShield,
  FiBell,
  FiEye,
  FiLogOut,
} from 'react-icons/fi'
import { GiWheat } from 'react-icons/gi'
import { useTranslation } from '../../hooks/useTranslation'
import { useAccess } from '../../contexts/AccessContext'
import { getVisibleNavItems } from '../../config/navConfig'
import authService from '../../services/authService'
import { isSuperAdmin } from '../../utils/accessControl'
import './Sidebar.css'

const ICONS = {
  '/dashboard/my': <FiLayout />,
  '/dashboard': <FiHome />,
  '/users': <FiUsers />,
  '/analytics': <FiBarChart2 />,
  '/reports': <FiDatabase />,
  '/products': <FiShoppingBag />,
  '/categories': <FiFolder />,
  '/orders': <FiShoppingCart />,
  '/chat-reports': <FiAlertCircle />,
  '/tickets': <FiMessageSquare />,
  '/feedback': <FiStar />,
  '/transport/providers': <FiTruck />,
  '/transport/vehicles': <FiTruck />,
  '/transport/requests': <FiPackage />,
  '/transport/price-lines': <FiDollarSign />,
  '/ads': <FiImage />,
  '/mobile-analytics': <FiSmartphone />,
  '/settings': <FiSettings />,
  '/rbac': <FiShield />,
  '/gov/alerts': <FiBell />,
  '/gov/market-control': <FiEye />,
}

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { roles, permissions } = useAccess()
  const user = authService.getUser()

  const visibleItems = getVisibleNavItems(roles, permissions)

  const displayName = user?.fullName || user?.email || t('common.adminUser')
  const roleLabel = isSuperAdmin(roles)
    ? t('rbac.roleSuperadmin')
    : roles?.length
      ? roles.join(', ')
      : t('common.administrator')

  const initials = (displayName || 'U')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    authService.logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <GiWheat />
            </div>
            <div className="logo-text-block">
              <h2 className="logo-text">{t('common.appName')}</h2>
              <p className="logo-subtitle">{t('common.appSubtitle')}</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={toggleSidebar}>
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="menu-list">
            {visibleItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path === '/rbac' ? '/rbac/permissions' : item.path}
                  className={({ isActive }) => {
                    const active =
                      isActive ||
                      (item.path === '/rbac' && window.location.pathname.startsWith('/rbac'))
                    return `menu-item ${active ? 'active' : ''}`
                  }}
                >
                  <span className="menu-icon">{ICONS[item.path] || <FiHome />}</span>
                  <span className="menu-label">{t(item.labelKey)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-footer-action danger" onClick={handleLogout}>
            <FiLogOut />
            <span>{t('common.logout')}</span>
          </button>
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <p className="user-name">{displayName}</p>
              <p className="user-role" title={roleLabel}>
                {roleLabel}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
