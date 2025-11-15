import React, { useState } from 'react'
import { FiUser, FiBell, FiLock, FiGlobe, FiSave, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi'
import { useNotifications } from '../contexts/NotificationContext'
import './Settings.css'

const Settings = () => {
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
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'security', label: 'Security', icon: <FiLock /> },
    { id: 'preferences', label: 'Preferences', icon: <FiGlobe /> },
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
          setRegistrationMessage('Device registered successfully! You will now receive notifications.')
        } else {
          setRegistrationStatus('error')
          setRegistrationMessage('Failed to get notification permission. Please allow notifications in your browser settings.')
        }
      } else {
        // Permission already granted, just register the device
        const userId = localStorage.getItem('userId')
        if (!userId) {
          setRegistrationStatus('error')
          setRegistrationMessage('User ID not found. Please log in again.')
          return
        }

        await registerDevice(userId)
        setRegistrationStatus('success')
        setRegistrationMessage('Device registered successfully!')
      }
    } catch (error) {
      console.error('Error registering device:', error)
      setRegistrationStatus('error')
      setRegistrationMessage(error.message || 'Failed to register device. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  const isDeviceRegistered = fcmToken && permission === 'granted'

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account settings and preferences</p>
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
              <h2 className="settings-section-title">Profile Settings</h2>
              <p className="settings-section-subtitle">Update your personal information</p>
              
              <div className="form-group">
                <label className="form-label">Full Name</label>
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
                <label className="form-label">Bio</label>
                <textarea className="form-textarea" rows="4" placeholder="Tell us about yourself..."></textarea>
              </div>

              <button className="btn btn-primary">
                <FiSave /> Save Changes
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2 className="settings-section-title">Notification Settings</h2>
              <p className="settings-section-subtitle">Manage how you receive notifications</p>
              
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
                  <h4 className="settings-item-title">Push Notifications</h4>
                  <p className="settings-item-desc">
                    Register this device to receive push notifications
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
                      <FiCheckCircle /> Device registered
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
                      Notifications are blocked. Please enable them in your browser settings.
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
                      <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> Registering...
                    </>
                  ) : (
                    <>
                      <FiBell /> {isDeviceRegistered ? 'Re-register Device' : 'Register Device for Notifications'}
                    </>
                  )}
                </button>
                {!isSupported && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Push notifications are not supported in this browser.
                  </p>
                )}
              </div>

              <button className="btn btn-primary">
                <FiSave /> Save Changes
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2 className="settings-section-title">Security Settings</h2>
              <p className="settings-section-subtitle">Manage your password and security preferences</p>
              
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
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

              <button className="btn btn-primary">
                <FiSave /> Update Password
              </button>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-section">
              <h2 className="settings-section-title">Preferences</h2>
              <p className="settings-section-subtitle">Customize your dashboard experience</p>
              
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-input">
                  <option>English</option>
                  <option>Arabic</option>
                  <option>French</option>
                  <option>Spanish</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Timezone</label>
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

              <button className="btn btn-primary">
                <FiSave /> Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings

