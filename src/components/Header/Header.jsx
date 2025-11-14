import React from 'react'
import { FiMenu, FiSearch, FiMail } from 'react-icons/fi'
import Notifications from '../Notifications/Notifications'
import './Header.css'

const Header = ({ toggleSidebar }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <FiMenu />
        </button>
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="search-input"
          />
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn" title="Messages">
          <FiMail />
          <span className="badge-dot"></span>
        </button>
        <Notifications />
        <div className="header-user">
          <img 
            src="https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff" 
            alt="User" 
            className="header-user-avatar"
          />
        </div>
      </div>
    </header>
  )
}

export default Header

