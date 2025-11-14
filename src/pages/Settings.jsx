import React, { useState } from 'react'
import { FiUser, FiBell, FiLock, FiGlobe, FiSave } from 'react-icons/fi'
import './Settings.css'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'security', label: 'Security', icon: <FiLock /> },
    { id: 'preferences', label: 'Preferences', icon: <FiGlobe /> },
  ]

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

