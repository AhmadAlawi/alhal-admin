import React, { useState, useEffect } from 'react'
import { FiDollarSign, FiSearch, FiRefreshCw, FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiInfo, FiAlertCircle } from 'react-icons/fi'
import transportService from '../services/transportService'
import { useTranslation } from '../hooks/useTranslation'
import './TransportPriceLines.css'

const TransportPriceLines = () => {
  const { t } = useTranslation()
  const [providers, setProviders] = useState([])
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [priceLines, setPriceLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPriceLine, setEditingPriceLine] = useState(null)
  const [regions, setRegions] = useState([])
  const [checkingGovPrice, setCheckingGovPrice] = useState(false)
  const [govPriceInfo, setGovPriceInfo] = useState(null)
  const [priceError, setPriceError] = useState(null)
  const [formData, setFormData] = useState({
    fromArea: '',
    toArea: '',
    price: '',
    isActive: true
  })

  useEffect(() => {
    fetchProviders()
    fetchRegions()
  }, [])

  useEffect(() => {
    if (selectedProvider) {
      fetchPriceLines(selectedProvider.transportProviderId)
    }
  }, [selectedProvider])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await transportService.getProvidersWithPriceLines()
      if (response.status === 'success' && response.data) {
        setProviders(Array.isArray(response.data) ? response.data : [])
      } else if (Array.isArray(response)) {
        setProviders(response)
      } else {
        setProviders([])
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err)
      setError(err.message || t('transport.error.loadProviders'))
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPriceLines = async (providerId) => {
    try {
      setLoading(true)
      const response = await transportService.getPriceLines(providerId)
      if (response.status === 'success' && response.data) {
        setPriceLines(Array.isArray(response.data) ? response.data : [])
      } else if (Array.isArray(response)) {
        setPriceLines(response)
      } else {
        setPriceLines([])
      }
    } catch (err) {
      console.error('Failed to fetch price lines:', err)
      setError(err.message || t('transport.error.loadPriceLines'))
      setPriceLines([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRegions = async () => {
    try {
      const response = await transportService.getRegions()
      // Handle different response structures (consistent with other fetch functions)
      if (response.status === 'success' && response.data) {
        setRegions(Array.isArray(response.data) ? response.data : [])
      } else if (response.data && Array.isArray(response.data)) {
        setRegions(response.data)
      } else if (Array.isArray(response)) {
        setRegions(response)
      } else {
        setRegions([])
      }
    } catch (err) {
      console.error('Failed to fetch regions:', err)
      setRegions([])
    }
  }

  const checkGovernmentPrice = async () => {
    if (!formData.fromArea || !formData.toArea) {
      setGovPriceInfo(null)
      return
    }

    try {
      setCheckingGovPrice(true)
      setPriceError(null)
      setGovPriceInfo(null)
      
      const response = await transportService.getOfficialPrice({
        fromRegion: formData.fromArea.toString(),
        toRegion: formData.toArea,
        distanceKm: 0,
        pricingType: 'government'
      })
      
      if (response) {
        setGovPriceInfo(response)
        // Check if entered price exceeds government max
        if (formData.price && Number(formData.price) > response.totalPrice) {
          setPriceError(`${t('transport.priceLines.priceExceedsGovMax')} ${response.totalPrice} ${t('transport.currency')}`)
        } else {
          setPriceError(null)
        }
      }
    } catch (err) {
      console.error('Failed to check government price:', err)
      setGovPriceInfo(null)
      // Don't show error if no government price exists (it's optional)
    } finally {
      setCheckingGovPrice(false)
    }
  }

  useEffect(() => {
    if (formData.fromArea && formData.toArea && !editingPriceLine) {
      const timer = setTimeout(() => {
        checkGovernmentPrice()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [formData.fromArea, formData.toArea])

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider)
    setSearchTerm('')
  }

  const handleCreate = () => {
    if (!selectedProvider) {
      alert(t('transport.priceLines.selectProviderFirst'))
      return
    }
    setEditingPriceLine(null)
    setFormData({
      fromArea: '',
      toArea: '',
      price: '',
      isActive: true
    })
    setGovPriceInfo(null)
    setPriceError(null)
    setShowModal(true)
  }

  const handleEdit = (priceLine) => {
    setEditingPriceLine(priceLine)
    setFormData({
      fromArea: priceLine.fromArea.toString(),
      toArea: priceLine.toArea,
      price: priceLine.price.toString(),
      isActive: priceLine.isActive
    })
    setGovPriceInfo(null)
    setPriceError(null)
    setShowModal(true)
  }

  const handleDelete = async (priceLineId) => {
    if (!window.confirm(t('transport.priceLines.confirmDelete'))) {
      return
    }

    try {
      await transportService.deletePriceLine(priceLineId)
      setPriceLines(priceLines.filter(pl => pl.priceLineId !== priceLineId))
      alert(t('transport.priceLines.deleteSuccess'))
    } catch (err) {
      console.error('Failed to delete price line:', err)
      alert(t('transport.priceLines.deleteError') + ': ' + (err.message || 'Unknown error'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProvider) return

    // Validate price against government max if available
    if (govPriceInfo && Number(formData.price) > govPriceInfo.totalPrice) {
      setPriceError(`${t('transport.priceLines.priceExceedsGovMax')} ${govPriceInfo.totalPrice} ${t('transport.currency')}`)
      return
    }

    try {
      const data = {
        transportProviderId: selectedProvider.transportProviderId,
        fromArea: Number(formData.fromArea),
        toArea: formData.toArea,
        price: Number(formData.price)
      }

      if (editingPriceLine) {
        await transportService.updatePriceLine(editingPriceLine.priceLineId, {
          ...data,
          isActive: formData.isActive
        })
        alert(t('transport.priceLines.updateSuccess'))
      } else {
        await transportService.createPriceLine(data)
        alert(t('transport.priceLines.createSuccess'))
      }

      setShowModal(false)
      setGovPriceInfo(null)
      setPriceError(null)
      fetchPriceLines(selectedProvider.transportProviderId)
    } catch (err) {
      console.error('Failed to save price line:', err)
      alert(t('transport.priceLines.saveError') + ': ' + (err.message || 'Unknown error'))
    }
  }

  const filteredPriceLines = priceLines.filter(pl => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (pl.fromArea && pl.fromArea.toString().includes(search)) ||
      (pl.toArea && pl.toArea.toLowerCase().includes(search)) ||
      (pl.price && pl.price.toString().includes(search))
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
      <div className="transport-price-lines-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transport-price-lines-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiDollarSign /> {t('transport.priceLines.title')}
          </h1>
          <p className="page-subtitle">{t('transport.priceLines.subtitle')}</p>
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

      <div className="price-lines-layout">
        <div className="providers-panel card">
          <h3>{t('transport.priceLines.providers')}</h3>
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder={t('transport.priceLines.searchProviders')}
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
                    {provider.priceLines?.length || 0} {t('transport.priceLines.priceLines')}
                  </span>
                </div>
                {provider.isVerified && (
                  <span className="badge badge-success">
                    <FiCheck /> {t('transport.providers.verified')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="price-lines-panel card">
          {selectedProvider ? (
            <>
              <div className="panel-header">
                <div>
                  <h3>{t('transport.priceLines.priceLinesFor')} {selectedProvider.userName}</h3>
                  <p className="panel-subtitle">
                    {priceLines.length} {t('transport.priceLines.priceLines')}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={handleCreate}>
                  <FiPlus /> {t('transport.priceLines.addPriceLine')}
                </button>
              </div>

              <div className="search-box">
                <FiSearch />
                <input
                  type="text"
                  placeholder={t('transport.priceLines.searchPriceLines')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('transport.priceLines.fromArea')}</th>
                      <th>{t('transport.priceLines.toArea')}</th>
                      <th>{t('transport.priceLines.price')}</th>
                      <th>{t('transport.priceLines.govMaxPrice')}</th>
                      <th>{t('transport.priceLines.status')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPriceLines.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-data">
                          {t('transport.priceLines.noPriceLines')}
                        </td>
                      </tr>
                    ) : (
                      filteredPriceLines.map((priceLine) => (
                        <tr key={priceLine.priceLineId}>
                          <td>{priceLine.fromArea}</td>
                          <td>{priceLine.toArea}</td>
                          <td>{priceLine.price} {t('transport.currency')}</td>
                          <td>
                            {priceLine.governmentMaxPrice 
                              ? `${priceLine.governmentMaxPrice} ${t('transport.currency')}`
                              : 'N/A'}
                          </td>
                          <td>
                            {priceLine.isActive ? (
                              <span className="badge badge-success">{t('common.active')}</span>
                            ) : (
                              <span className="badge badge-warning">{t('common.inactive')}</span>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-icon"
                                onClick={() => handleEdit(priceLine)}
                                title={t('common.edit')}
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-icon btn-danger"
                                onClick={() => handleDelete(priceLine.priceLineId)}
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
              <FiDollarSign size={48} />
              <p>{t('transport.priceLines.selectProvider')}</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingPriceLine 
                  ? t('transport.priceLines.editPriceLine')
                  : t('transport.priceLines.addPriceLine')}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>{t('transport.priceLines.fromArea')} *</label>
                {regions.length > 0 ? (
                  <select
                    value={formData.fromArea}
                    onChange={(e) => setFormData({ ...formData, fromArea: e.target.value })}
                    required
                  >
                    <option value="">{t('transport.priceLines.selectFromArea') || 'Select From Area'}</option>
                    {regions.map((region, idx) => (
                      <option key={idx} value={region}>{region}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.fromArea}
                    onChange={(e) => setFormData({ ...formData, fromArea: e.target.value })}
                    required
                    placeholder="Governorate ID or Name"
                  />
                )}
              </div>
              <div className="form-group">
                <label>{t('transport.priceLines.toArea')} *</label>
                {regions.length > 0 ? (
                  <select
                    value={formData.toArea}
                    onChange={(e) => setFormData({ ...formData, toArea: e.target.value })}
                    required
                  >
                    <option value="">{t('transport.priceLines.selectToArea') || 'Select To Area'}</option>
                    {regions.map((region, idx) => (
                      <option key={idx} value={region}>{region}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.toArea}
                    onChange={(e) => setFormData({ ...formData, toArea: e.target.value })}
                    required
                    placeholder="Destination area"
                  />
                )}
              </div>
              
              {govPriceInfo && (
                <div className="gov-price-info">
                  <FiInfo />
                  <div>
                    <strong>{t('transport.priceLines.govPrice')}:</strong>
                    <span>{govPriceInfo.totalPrice} {t('transport.currency')}</span>
                    {govPriceInfo.distanceKm && (
                      <span className="gov-price-detail">
                        ({govPriceInfo.distanceKm} km × {govPriceInfo.pricePerKm} {t('transport.currency')}/km)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>{t('transport.priceLines.price')} *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => {
                    setFormData({ ...formData, price: e.target.value })
                    if (govPriceInfo && Number(e.target.value) > govPriceInfo.totalPrice) {
                      setPriceError(`${t('transport.priceLines.priceExceedsGovMax')} ${govPriceInfo.totalPrice} ${t('transport.currency')}`)
                    } else {
                      setPriceError(null)
                    }
                  }}
                  required
                  placeholder="0.00"
                  className={priceError ? 'input-error' : ''}
                />
                {checkingGovPrice && (
                  <span className="checking-price">
                    {t('transport.priceLines.checkingGovPrice') || 'Checking government price...'}
                  </span>
                )}
                {priceError && (
                  <span className="price-error">
                    <FiAlertCircle /> {priceError}
                  </span>
                )}
                {govPriceInfo && !priceError && formData.price && (
                  <span className="price-ok">
                    <FiCheck /> {t('transport.priceLines.priceWithinLimit') || 'Price is within government limit'}
                  </span>
                )}
              </div>
              {editingPriceLine && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    {t('transport.priceLines.active')}
                  </label>
                </div>
              )}
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

export default TransportPriceLines
