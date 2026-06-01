import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiUser, FiBell, FiLock, FiGlobe, FiSave, FiCheckCircle, FiXCircle, FiLoader, FiDollarSign, FiChevronRight } from 'react-icons/fi'
import { useNotifications } from '../contexts/NotificationContext'
import { useLocale } from '../contexts/LocaleContext'
import { useTranslation } from '../hooks/useTranslation'
import './Settings.css'

const Settings = () => {
  const { t } = useTranslation()
  const { language, changeLanguage } = useLocale()
  const [activeTab, setActiveTab] = useState('profile')
  const { 
    permission, 
    fcmToken, 
    isSupported, 
    requestPermission,
    registerDevice
  } = useNotifications()
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState(null) // 'success', 'error', null
  const [registrationMessage, setRegistrationMessage] = useState('')

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: <FiUser /> },
    { id: 'notifications', label: t('settings.notifications'), icon: <FiBell /> },
    { id: 'security', label: t('settings.security'), icon: <FiLock /> },
    { id: 'preferences', label: t('settings.preferences'), icon: <FiGlobe /> },
  ]

  const handleRegisterDevice = async () => {
    setIsRegistering(true)
    setRegistrationStatus(null)
    setRegistrationMessage('')

    try {
      // If permission is not granted, request it first (which will auto-register)
      if (permission !== 'granted') {
        const token = await requestPermission()
        if (token) {
          setRegistrationStatus('success')
          setRegistrationMessage(t('settings.deviceRegisterSuccess'))
        } else {
          setRegistrationStatus('error')
          setRegistrationMessage(t('settings.deviceRegisterPermissionError'))
        }
      } else {
        // Permission already granted, just register the device
        const userId = localStorage.getItem('userId')
        if (!userId) {
          setRegistrationStatus('error')
          setRegistrationMessage(t('settings.deviceRegisterUserError'))
          return
        }

        await registerDevice(userId)
        setRegistrationStatus('success')
        setRegistrationMessage(t('settings.deviceRegisterSuccessShort'))
      }
    } catch (error) {
      console.error('Error registering device:', error)
      setRegistrationStatus('error')
      setRegistrationMessage(error.message || t('settings.deviceRegisterError'))
    } finally {
      setIsRegistering(false)
    }
  }

  const isDeviceRegistered = fcmToken && permission === 'granted'

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.subtitleExtended')}</p>
      </div>

      <div className="settings-admin-links card">
        <Link to="/settings/localization" className="settings-admin-link">
          <FiGlobe />
          <div>
            <strong>{t('settings.localizationLink')}</strong>
            <span>{t('settings.localizationLinkDesc')}</span>
          </div>
          <FiChevronRight />
        </Link>
        <Link to="/settings/currency" className="settings-admin-link">
          <FiDollarSign />
          <div>
            <strong>{t('settings.currencyLink')}</strong>
            <span>{t('settings.currencyLinkDesc')}</span>
          </div>
          <FiChevronRight />
        </Link>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar card">
          <nav className="settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="settings-nav-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-content card">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2 className="settings-section-title">{t('settings.profileSettings')}</h2>
              <p className="settings-section-subtitle">{t('settings.profileSubtitle')}</p>
              
              <div className="form-group">
                <label className="form-label">{t('settings.fullName')}</label>
                <input type="text" className="form-input" defaultValue="Admin User" />
              </div>

              <div className="form-group">
                <label className="form-label">EmailOrPhone Address</label>
                <input type="EmailOrPhone" className="form-input" defaultValue="admin@alhal.com" />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" defaultValue="+1 (555) 123-4567" />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.bio')}</label>
                <textarea className="form-textarea" rows="4" placeholder={t('settings.bioPlaceholder')}></textarea>
              </div>

              <button type="button" className="btn btn-primary">
                <FiSave /> {t('settings.saveChanges')}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2 className="settings-section-title">{t('settings.notificationSettings')}</h2>
              <p className="settings-section-subtitle">{t('settings.notificationSubtitle')}</p>
              
              <div className="settings-item">
                <div className="settings-item-info">
                  <h4 className="settings-item-title">EmailOrPhone Notifications</h4>
                  <p className="settings-item-desc">Receive EmailOrPhone updates about your account</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <h4 className="settings-item-title">Order Updates</h4>
                  <p className="settings-item-desc">Get notified about order status changes</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <h4 className="settings-item-title">Marketing EmailOrPhones</h4>
                  <p className="settings-item-desc">Receive promotional offers and news</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Device Registration Section */}
              <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <div className="settings-item-info" style={{ width: '100%' }}>
                  <h4 className="settings-item-title">{t('settings.pushNotificationsLabel')}</h4>
                  <p className="settings-item-desc">
                    {t('dashboard.pushNotificationsSubtitle')}
                  </p>
                  {isDeviceRegistered && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                      borderRadius: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: 'rgb(34, 197, 94)'
                    }}>
                      <FiCheckCircle /> {t('settings.deviceRegistered')}
                    </div>
                  )}
                  {permission === 'denied' && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      color: 'rgb(239, 68, 68)'
                    }}>
                      {t('common.notificationsBlocked')}
                    </div>
                  )}
                  {registrationStatus && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      backgroundColor: registrationStatus === 'success' 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)', 
                      borderRadius: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: registrationStatus === 'success' 
                        ? 'rgb(34, 197, 94)' 
                        : 'rgb(239, 68, 68)'
                    }}>
                      {registrationStatus === 'success' ? <FiCheckCircle /> : <FiXCircle />}
                      {registrationMessage}
                    </div>
                  )}
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleRegisterDevice}
                  disabled={isRegistering || !isSupported || permission === 'denied'}
                  style={{ 
                    alignSelf: 'flex-start',
                    opacity: (isRegistering || !isSupported || permission === 'denied') ? 0.6 : 1,
                    cursor: (isRegistering || !isSupported || permission === 'denied') ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isRegistering ? (
                    <>
                      <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> {t('settings.registering')}
                    </>
                  ) : (
                    <>
                      <FiBell /> {isDeviceRegistered ? t('settings.reregisterDevice') : t('settings.registerDevice')}
                    </>
                  )}
                </button>
                {!isSupported && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {t('settings.pushNotSupported')}
                  </p>
                )}
              </div>

              <button type="button" className="btn btn-primary">
                <FiSave /> {t('settings.saveChanges')}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2 className="settings-section-title">{t('settings.securitySettings')}</h2>
              <p className="settings-section-subtitle">{t('settings.securitySubtitle')}</p>
              
              <div className="form-group">
                <label className="form-label">{t('settings.currentPassword')}</label>
                <input type="password" className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.newPassword')}</label>
                <input type="password" className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.confirmPassword')}</label>
                <input type="password" className="form-input" />
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <h4 className="settings-item-title">Two-Factor Authentication</h4>
                  <p className="settings-item-desc">Add an extra layer of security to your account</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <button type="button" className="btn btn-primary">
                <FiSave /> {t('settings.updatePassword')}
              </button>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-section">
              <h2 className="settings-section-title">{t('settings.preferencesSettings')}</h2>
              <p className="settings-section-subtitle">{t('settings.preferencesSubtitle')}</p>
              
              <div className="form-group">
                <label className="form-label">{t('settings.language')}</label>
                <select
                  className="form-input"
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                >
                  <option value="ar">{t('settings.languageArabic')}</option>
                  <option value="en">{t('settings.languageEnglish')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.timezone')}</label>
                <select className="form-input">
                  <option>UTC</option>
                  <option>GMT+3 (Riyadh)</option>
                  <option>EST</option>
                  <option>PST</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date Format</label>
                <select className="form-input">
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>

              <button type="button" className="btn btn-primary">
                <FiSave /> {t('settings.savePreferences')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings

