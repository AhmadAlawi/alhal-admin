import React, { useState, useEffect } from 'react'
import { FiTruck, FiSearch, FiRefreshCw, FiPlus, FiEdit, FiTrash2, FiX, FiEye } from 'react-icons/fi'
import transportService from '../services/transportService'
import { useTranslation } from '../hooks/useTranslation'
import './TransportVehicles.css'

const TransportVehicles = () => {
  const { t } = useTranslation()
  const [providers, setProviders] = useState([])
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [formData, setFormData] = useState({
    vehicleType: '',
    capacity: '',
    model: '',
    storageType: '',
    hasTools: false,
    workersAvailable: 0,
    pricePerKm: '',
    availabilityHours: '08:00-18:00',
    canProvideLoadingWorkers: false
  })

  useEffect(() => {
    fetchProviders()
  }, [])

  useEffect(() => {
    if (selectedProvider) {
      fetchVehicles(selectedProvider.transportProviderId)
    }
  }, [selectedProvider])

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

  const fetchVehicles = async (providerId) => {
    try {
      setLoading(true)
      const response = await transportService.getProviderVehicles(providerId)
      setVehicles(Array.isArray(response) ? response : response.data || [])
    } catch (err) {
      console.error('Failed to fetch vehicles:', err)
      setError(err.message || t('transport.error.loadVehicles'))
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider)
    setSearchTerm('')
  }

  const handleCreate = () => {
    if (!selectedProvider) {
      alert(t('transport.vehicles.selectProviderFirst'))
      return
    }
    setEditingVehicle(null)
    setFormData({
      vehicleType: '',
      capacity: '',
      model: '',
      storageType: '',
      hasTools: false,
      workersAvailable: 0,
      pricePerKm: '',
      availabilityHours: '08:00-18:00',
      canProvideLoadingWorkers: false
    })
    setShowModal(true)
  }

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      vehicleType: vehicle.vehicleType || '',
      capacity: vehicle.capacity || '',
      model: vehicle.model || '',
      storageType: vehicle.storageType || '',
      hasTools: vehicle.hasTools || false,
      workersAvailable: vehicle.workersAvailable || 0,
      pricePerKm: vehicle.pricePerKm || '',
      availabilityHours: vehicle.availabilityHours || '08:00-18:00',
      canProvideLoadingWorkers: vehicle.canProvideLoadingWorkers || false
    })
    setShowModal(true)
  }

  const handleDelete = async (vehicleId) => {
    if (!window.confirm(t('transport.vehicles.confirmDelete'))) {
      return
    }

    try {
      await transportService.deleteVehicle(selectedProvider.transportProviderId, vehicleId)
      setVehicles(vehicles.filter(v => v.transportVehicleId !== vehicleId))
      alert(t('transport.vehicles.deleteSuccess'))
    } catch (err) {
      console.error('Failed to delete vehicle:', err)
      alert(t('transport.vehicles.deleteError') + ': ' + (err.message || 'Unknown error'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProvider) return

    try {
      const submitData = {
        ...formData,
        workersAvailable: Number(formData.workersAvailable),
        pricePerKm: formData.pricePerKm ? Number(formData.pricePerKm) : null
      }

      if (editingVehicle) {
        alert(t('transport.vehicles.updateNote'))
      } else {
        await transportService.addVehicle(selectedProvider.transportProviderId, submitData)
        alert(t('transport.vehicles.createSuccess'))
        setShowModal(false)
        fetchVehicles(selectedProvider.transportProviderId)
      }
    } catch (err) {
      console.error('Failed to save vehicle:', err)
      alert(t('transport.vehicles.saveError') + ': ' + (err.message || 'Unknown error'))
    }
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (vehicle.vehicleType && vehicle.vehicleType.toLowerCase().includes(search)) ||
      (vehicle.capacity && vehicle.capacity.toLowerCase().includes(search)) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(search))
    )
  })

  const filteredProviders = providers.filter(provider => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (provider.userName && provider.userName.toLowerCase().includes(search)) ||
      (provider.transportProviderId && provider.transportProviderId.toString().includes(search))
    )
  })

  if (loading && providers.length === 0) {
    return (
      <div className="transport-vehicles-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transport-vehicles-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiTruck /> {t('transport.vehicles.title')}
          </h1>
          <p className="page-subtitle">{t('transport.vehicles.subtitle')}</p>
        </div>
        <div className="header-actions">
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

      <div className="vehicles-layout">
        <div className="providers-panel card">
          <h3>{t('transport.vehicles.providers')}</h3>
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder={t('transport.vehicles.searchProviders')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="providers-list">
            {filteredProviders.map((provider) => (
              <div
                key={provider.transportProviderId}
                className={`provider-item ${selectedProvider?.transportProviderId === provider.transportProviderId ? 'active' : ''}`}
                onClick={() => handleProviderSelect(provider)}
              >
                <div className="provider-info">
                  <strong>{provider.userName || `Provider #${provider.transportProviderId}`}</strong>
                  <span className="provider-meta">
                    {provider.vehicles?.length || 0} {t('transport.vehicles.vehicles')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vehicles-panel card">
          {selectedProvider ? (
            <>
              <div className="panel-header">
                <div>
                  <h3>{t('transport.vehicles.vehiclesFor')} {selectedProvider.userName}</h3>
                  <p className="panel-subtitle">
                    {vehicles.length} {t('transport.vehicles.vehicles')}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={handleCreate}>
                  <FiPlus /> {t('transport.vehicles.addVehicle')}
                </button>
              </div>

              <div className="search-box">
                <FiSearch />
                <input
                  type="text"
                  placeholder={t('transport.vehicles.searchVehicles')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('transport.vehicles.type')}</th>
                      <th>{t('transport.vehicles.capacity')}</th>
                      <th>{t('transport.vehicles.model')}</th>
                      <th>{t('transport.vehicles.storageType')}</th>
                      <th>{t('transport.vehicles.pricePerKm')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-data">
                          {t('transport.vehicles.noVehicles')}
                        </td>
                      </tr>
                    ) : (
                      filteredVehicles.map((vehicle) => (
                        <tr key={vehicle.transportVehicleId}>
                          <td>{vehicle.vehicleType}</td>
                          <td>{vehicle.capacity}</td>
                          <td>{vehicle.model || 'N/A'}</td>
                          <td>{vehicle.storageType || 'N/A'}</td>
                          <td>
                            {vehicle.pricePerKm 
                              ? `${vehicle.pricePerKm} ${t('transport.currency')}`
                              : 'N/A'}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-icon"
                                onClick={() => handleEdit(vehicle)}
                                title={t('common.edit')}
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-icon btn-danger"
                                onClick={() => handleDelete(vehicle.transportVehicleId)}
                                title={t('common.delete')}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <FiTruck size={48} />
              <p>{t('transport.vehicles.selectProvider')}</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingVehicle 
                  ? t('transport.vehicles.editVehicle')
                  : t('transport.vehicles.addVehicle')}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('transport.vehicles.type')} *</label>
                  <input
                    type="text"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    required
                    placeholder="شاحنة مبردة"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.vehicles.capacity')} *</label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    placeholder="5 إلى 10 طن"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.vehicles.model')} *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    placeholder="2020 Mercedes Actros"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.vehicles.storageType')} *</label>
                  <input
                    type="text"
                    value={formData.storageType}
                    onChange={(e) => setFormData({ ...formData, storageType: e.target.value })}
                    required
                    placeholder="تبريد بالغاز"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.vehicles.workersAvailable')}</label>
                  <input
                    type="number"
                    value={formData.workersAvailable}
                    onChange={(e) => setFormData({ ...formData, workersAvailable: e.target.value })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.vehicles.pricePerKm')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerKm}
                    onChange={(e) => setFormData({ ...formData, pricePerKm: e.target.value })}
                    placeholder="2.0"
                  />
                </div>
                <div className="form-group">
                  <label>{t('transport.vehicles.availabilityHours')}</label>
                  <input
                    type="text"
                    value={formData.availabilityHours}
                    onChange={(e) => setFormData({ ...formData, availabilityHours: e.target.value })}
                    placeholder="08:00-20:00"
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.hasTools}
                      onChange={(e) => setFormData({ ...formData, hasTools: e.target.checked })}
                    />
                    {t('transport.vehicles.hasTools')}
                  </label>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.canProvideLoadingWorkers}
                      onChange={(e) => setFormData({ ...formData, canProvideLoadingWorkers: e.target.checked })}
                    />
                    {t('transport.vehicles.canProvideLoadingWorkers')}
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
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

export default TransportVehicles
