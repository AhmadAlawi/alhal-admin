import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  FiHome, 
  FiUsers, 
  FiBarChart2, 
  FiShoppingBag,
  FiFolder,
  FiShoppingCart,
  FiSettings,
  FiX,
  FiDatabase
} from 'react-icons/fi'
import { useTranslation } from '../../hooks/useTranslation'
import './Sidebar.css'

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { t } = useTranslation()
  
  const menuItems = [
    { path: '/dashboard', icon: <FiHome />, label: t('common.dashboard') },
    { path: '/users', icon: <FiUsers />, label: t('common.users') },
    { path: '/analytics', icon: <FiBarChart2 />, label: t('common.analytics') },
    { path: '/reports', icon: <FiDatabase />, label: t('common.reports') },
    { path: '/products', icon: <FiShoppingBag />, label: t('common.products') },
    { path: '/categories', icon: <FiFolder />, label: t('common.categories') },
    { path: '/orders', icon: <FiShoppingCart />, label: t('common.orders') },
    { path: '/settings', icon: <FiSettings />, label: t('common.settings') },
  ]

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">AH</div>
            <h2 className="logo-text">Al-Hal Admin</h2>
          </div>
          <button className="close-btn" onClick={toggleSidebar}>
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="menu-list">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">AD</div>
            <div className="user-details">
              <p className="user-name">Admin User</p>
              <p className="user-role">Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

