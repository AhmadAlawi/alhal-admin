import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMenu, FiSearch, FiMail, FiLogOut, FiUser, FiChevronDown, FiGlobe } from 'react-icons/fi'
import Notifications from '../Notifications/Notifications'
import authService from '../../services/authService'
import { useLocale } from '../../contexts/LocaleContext'
import { useTranslation } from '../../hooks/useTranslation'
import './Header.css'

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const langMenuRef = useRef(null)
  const { language, changeLanguage } = useLocale()
  const { t } = useTranslation()
  const user = authService.getUser()
  const userName = user?.fullName || user?.name || user?.email || 'Admin User'

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    authService.logout()
    navigate('/login', { replace: true })
  }

  const getUserInitials = () => {
    if (userName && userName !== 'Admin User') {
      return userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }
    return 'AU'
  }

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
            placeholder={t('common.search')} 
            className="search-input"
          />
        </div>
      </div>

      <div className="header-right">
        <div className="header-lang-wrapper" ref={langMenuRef}>
          <button 
            className="icon-btn" 
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            title={t('settings.language')}
          >
            <FiGlobe />
          </button>
          {langMenuOpen && (
            <div className="lang-menu">
              <button 
                className={`lang-menu-item ${language === 'ar' ? 'active' : ''}`}
                onClick={() => {
                  changeLanguage('ar')
                  setLangMenuOpen(false)
                }}
              >
                <span>العربية</span>
                {language === 'ar' && <span className="check">✓</span>}
              </button>
              <button 
                className={`lang-menu-item ${language === 'en' ? 'active' : ''}`}
                onClick={() => {
                  changeLanguage('en')
                  setLangMenuOpen(false)
                }}
              >
                <span>English</span>
                {language === 'en' && <span className="check">✓</span>}
              </button>
            </div>
          )}
        </div>
        <button className="icon-btn" title="Messages">
          <FiMail />
          <span className="badge-dot"></span>
        </button>
        <Notifications />
        <div className="header-user-wrapper" ref={userMenuRef}>
          <button 
            className="header-user-btn" 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            title="User menu"
          >
            <div className="header-user-avatar">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={userName} 
                />
              ) : (
                <span className="user-initials">{getUserInitials()}</span>
              )}
            </div>
            <span className="header-user-name">{userName}</span>
            <FiChevronDown className={`user-menu-icon ${userMenuOpen ? 'open' : ''}`} />
          </button>
          
          {userMenuOpen && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-menu-avatar">
                  {user?.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt={userName} 
                    />
                  ) : (
                    <span className="user-initials">{getUserInitials()}</span>
                  )}
                </div>
                <div className="user-menu-info">
                  <div className="user-menu-name">{userName}</div>
                  <div className="user-menu-email">{user?.email || ''}</div>
                </div>
              </div>
              <div className="user-menu-divider"></div>
              <button 
                className="user-menu-item"
                onClick={() => {
                  setUserMenuOpen(false)
                  navigate('/settings')
                }}
              >
                <FiUser />
                <span>{t('settings.profile')}</span>
              </button>
              <button 
                className="user-menu-item user-menu-item-danger"
                onClick={handleLogout}
              >
                <FiLogOut />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

