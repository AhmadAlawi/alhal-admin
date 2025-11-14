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
  FiX
} from 'react-icons/fi'
import './Sidebar.css'

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/users', icon: <FiUsers />, label: 'Users' },
    { path: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
    { path: '/products', icon: <FiShoppingBag />, label: 'Products' },
    { path: '/categories', icon: <FiFolder />, label: 'Categories' },
    { path: '/orders', icon: <FiShoppingCart />, label: 'Orders' },
    { path: '/settings', icon: <FiSettings />, label: 'Settings' },
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

