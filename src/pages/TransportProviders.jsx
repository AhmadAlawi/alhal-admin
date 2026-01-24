import React, { useState, useEffect } from 'react'
import { FiTruck, FiSearch, FiRefreshCw, FiCheck, FiX, FiEye, FiMapPin, FiPlus, FiEdit } from 'react-icons/fi'
import transportService from '../services/transportService'
import { useTranslation } from '../hooks/useTranslation'
import './TransportProviders.css'

const TransportProviders = () => {
  const { t } = useTranslation()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState(null)
  const [verifying, setVerifying] = useState(null)
  const [formData, setFormData] = useState({
    userId: '',
    accountType: 'individual',
    walletAccount: '',
    coveredAreas: '',
    workersAvailable: 0,
    availabilityHours: '08:00-18:00',
    preferredPaymentMethod: '',
    estimatedPricePerKm: ''
  })

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await transportService.getProviders()
      setProviders(Array.isArray(response) ? response : response.data || [])
    } catch (err) {
      console.error('Failed to fetch providers:', err)
      setError(err.message || t('transport.error.loadProviders'))
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (providerId, currentStatus) => {
    if (!window.confirm(
      currentStatus 
        ? t('transport.providers.confirmUnverify')
        : t('transport.providers.confirmVerify')
    )) {
      return
    }

    try {
      setVerifying(providerId)
      await transportService.verifyProvider(providerId, !currentStatus)
      setProviders(providers.map(p => 
        p.transportProviderId === providerId 
          ? { ...p, isVerified: !currentStatus, verificationDate: new Date().toISOString() }
          : p
      ))
      alert(t('transport.providers.verifySuccess'))
    } catch (err) {
      console.error('Failed to verify provider:', err)
      alert(t('transport.providers.verifyError') + ': ' + (err.message || 'Unknown error'))
    } finally {
      setVerifying(null)
    }
  }

  const handleViewDetails = (provider) => {
    setSelectedProvider(provider)
    setShowDetailModal(true)
  }

  const handleEdit = (provider) => {
    setEditingProvider(provider)
    setFormData({
      userId: provider.userId || '',
      accountType: provider.accountType || 'individual',
      walletAccount: provider.walletAccount || '',
      coveredAreas: provider.coveredAreas || '',
      workersAvailable: provider.workersAvailable || 0,
      availabilityHours: provider.availabilityHours || '08:00-18:00',
      preferredPaymentMethod: provider.preferredPaymentMethod || '',
      estimatedPricePerKm: provider.estimatedPricePerKm || ''
    })
    setShowFormModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        userId: Number(formData.userId),
        workersAvailable: Number(formData.workersAvailable),
        estimatedPricePerKm: formData.estimatedPricePerKm ? Number(formData.estimatedPricePerKm) : null
      }

      if (editingProvider) {
        // Note: Update endpoint might not exist, this is for future use
        alert(t('transport.providers.updateNote'))
      } else {
        await transportService.createProvider(submitData)
        alert(t('transport.providers.createSuccess'))
        setShowFormModal(false)
        fetchProviders()
      }
    } catch (err) {
      console.error('Failed to save provider:', err)
      alert(t('transport.providers.saveError') + ': ' + (err.message || 'Unknown error'))
    }
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedProvider(null)
  }

  const closeFormModal = () => {
    setShowFormModal(false)
    setEditingProvider(null)
    setFormData({
      userId: '',
      accountType: 'individual',
      walletAccount: '',
      coveredAreas: '',
      workersAvailable: 0,
      availabilityHours: '08:00-18:00',
      preferredPaymentMethod: '',
      estimatedPricePerKm: ''
    })
  }

  const filteredProviders = providers.filter(provider => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (provider.userName && provider.userName.toLowerCase().includes(search)) ||
      (provider.userEmail && provider.userEmail.toLowerCase().includes(search)) ||
      (provider.userPhone && provider.userPhone.toLowerCase().includes(search)) ||
      (provider.transportProviderId && provider.transportProviderId.toString().includes(search)) ||
      (provider.coveredAreas && provider.coveredAreas.toLowerCase().includes(search))
    )
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="transport-providers-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transport-providers-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiTruck /> {t('transport.providers.title')}
          </h1>
          <p className="page-subtitle">{t('transport.providers.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => {
            setEditingProvider(null)
            setFormData({
              userId: '',
              accountType: 'individual',
              walletAccount: '',
              coveredAreas: '',
              workersAvailable: 0,
              availabilityHours: '08:00-18:00',
              preferredPaymentMethod: '',
              estimatedPricePerKm: ''
            })
            setShowFormModal(true)
          }}>
            <FiPlus /> {t('transport.providers.addProvider')}
          </button>
          <button className="btn btn-outline" onClick={fetchProviders}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message card">
          <FiX /> {error}
        </div>
      )}

      <div className="filters-section card">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder={t('transport.providers.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container card">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('transport.providers.id')}</th>
              <th>{t('transport.providers.name')}</th>
              <th>{t('transport.providers.email')}</th>
              <th>{t('transport.providers.phone')}</th>
              <th>{t('transport.providers.accountType')}</th>
              <th>{t('transport.providers.coveredAreas')}</th>
              <th>{t('transport.providers.verified')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredProviders.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              filteredProviders.map((provider) => (
                <tr key={provider.transportProviderId}>
                  <td>{provider.transportProviderId}</td>
                  <td>{provider.userName || provider.user?.fullName || 'N/A'}</td>
                  <td>{provider.userEmail || provider.user?.email || 'N/A'}</td>
                  <td>{provider.userPhone || provider.user?.phone || 'N/A'}</td>
                  <td>
                    <span className={`badge ${provider.accountType === 'company' ? 'badge-primary' : 'badge-secondary'}`}>
                      {provider.accountType === 'company' ? t('transport.providers.company') : t('transport.providers.individual')}
                    </span>
                  </td>
                  <td>
                    <div className="covered-areas">
                      <FiMapPin />
                      {provider.coveredAreas || 'N/A'}
                    </div>
                  </td>
                  <td>
                    {provider.isVerified ? (
                      <span className="badge badge-success">
                        <FiCheck /> {t('transport.providers.verified')}
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        {t('transport.providers.notVerified')}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-icon"
                        onClick={() => handleViewDetails(provider)}
                        title={t('common.view')}
                      >
                        <FiEye />
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-info"
                        onClick={() => handleEdit(provider)}
                        title={t('common.edit')}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className={`btn btn-sm btn-icon ${provider.isVerified ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleVerify(provider.transportProviderId, provider.isVerified)}
                        disabled={verifying === provider.transportProviderId}
                        title={provider.isVerified ? t('transport.providers.unverify') : t('transport.providers.verify')}
                      >
                        {verifying === provider.transportProviderId ? (
                          <div className="spinner-small"></div>
                        ) : provider.isVerified ? (
                          <FiX />
                        ) : (
                          <FiCheck />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDetailModal && selectedProvider && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('transport.providers.details')}</h2>
              <button className="modal-close" onClick={closeDetailModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>{t('transport.providers.basicInfo')}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('transport.providers.id')}</label>
                    <span>{selectedProvider.transportProviderId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.providers.name')}</label>
                    <span>{selectedProvider.userName || selectedProvider.user?.fullName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.providers.email')}</label>
                    <span>{selectedProvider.userEmail || selectedProvider.user?.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.providers.phone')}</label>
                    <span>{selectedProvider.userPhone || selectedProvider.user?.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.providers.accountType')}</label>
                    <span>{selectedProvider.accountType}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.providers.coveredAreas')}</label>
                    <span>{selectedProvider.coveredAreas || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.providers.workersAvailable')}</label>
                    <span>{selectedProvider.workersAvailable || 0}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.providers.availabilityHours')}</label>
                    <span>{selectedProvider.availabilityHours || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.providers.verified')}</label>
                    <span>{selectedProvider.isVerified ? t('common.yes') : t('common.no')}</span>
                  </div>
                  {selectedProvider.verificationDate && (
                    <div className="detail-item">
                      <label>{t('transport.providers.verificationDate')}</label>
                      <span>{formatDate(selectedProvider.verificationDate)}</span>
                    </div>
                  )}
                  {selectedProvider.estimatedPricePerKm && (
                    <div className="detail-item">
                      <label>{t('transport.providers.estimatedPricePerKm')}</label>
                      <span>{selectedProvider.estimatedPricePerKm} {t('transport.currency')}</span>
                    </div>
                  )}
                </div>
              </div>
              {selectedProvider.vehicles && selectedProvider.vehicles.length > 0 && (
                <div className="detail-section">
                  <h3>{t('transport.providers.vehicles')} ({selectedProvider.vehicles.length})</h3>
                  <div className="vehicles-list">
                    {selectedProvider.vehicles.map((vehicle, idx) => (
                      <div key={idx} className="vehicle-item">
                        <strong>{vehicle.vehicleType}</strong> - {vehicle.capacity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingProvider 
                  ? t('transport.providers.editProvider')
                  : t('transport.providers.addProvider')}
              </h2>
              <button className="modal-close" onClick={closeFormModal}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('transport.providers.userId')} *</label>
                  <input
                    type="number"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                    placeholder="User ID"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.providers.accountType')} *</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    required
                  >
                    <option value="individual">{t('transport.providers.individual')}</option>
                    <option value="company">{t('transport.providers.company')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('transport.providers.walletAccount')} *</label>
                  <input
                    type="text"
                    value={formData.walletAccount}
                    onChange={(e) => setFormData({ ...formData, walletAccount: e.target.value })}
                    required
                    placeholder="Wallet account"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.providers.coveredAreas')}</label>
                  <input
                    type="text"
                    value={formData.coveredAreas}
                    onChange={(e) => setFormData({ ...formData, coveredAreas: e.target.value })}
                    placeholder="دمشق, ريف دمشق, حمص"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.providers.workersAvailable')}</label>
                  <input
                    type="number"
                    value={formData.workersAvailable}
                    onChange={(e) => setFormData({ ...formData, workersAvailable: e.target.value })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.providers.availabilityHours')}</label>
                  <input
                    type="text"
                    value={formData.availabilityHours}
                    onChange={(e) => setFormData({ ...formData, availabilityHours: e.target.value })}
                    placeholder="08:00-18:00"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.providers.preferredPaymentMethod')}</label>
                  <input
                    type="text"
                    value={formData.preferredPaymentMethod}
                    onChange={(e) => setFormData({ ...formData, preferredPaymentMethod: e.target.value })}
                    placeholder="نقدي / إلكتروني"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.providers.estimatedPricePerKm')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estimatedPricePerKm}
                    onChange={(e) => setFormData({ ...formData, estimatedPricePerKm: e.target.value })}
                    placeholder="2.5"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={closeFormModal}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransportProviders
