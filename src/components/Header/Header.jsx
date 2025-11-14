import React from 'react'
import { FiMenu, FiSearch, FiBell, FiMail } from 'react-icons/fi'
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
        <button className="icon-btn">
          <FiMail />
          <span className="badge-dot"></span>
        </button>
        <button className="icon-btn">
          <FiBell />
          <span className="badge-dot"></span>
        </button>
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

