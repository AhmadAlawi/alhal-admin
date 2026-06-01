import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { FiDollarSign, FiSearch, FiRefreshCw, FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiInfo, FiAlertCircle } from 'react-icons/fi'
import transportService from '../services/transportService'
import citiesService from '../services/citiesService'
import { useTranslation } from '../hooks/useTranslation'
import { useCurrency } from '../contexts/CurrencyContext'
import './TransportPriceLines.css'
import './transport-shared.css'

const TransportPriceLines = () => {
  const { t } = useTranslation()
  const { formatMoney, formatMoneyPerUnit } = useCurrency()
  const [providers, setProviders] = useState([])
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [priceLines, setPriceLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPriceLine, setEditingPriceLine] = useState(null)
  const [cities, setCities] = useState([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [citiesLoadError, setCitiesLoadError] = useState(null)
  const [checkingGovPrice, setCheckingGovPrice] = useState(false)
  const [govPriceInfo, setGovPriceInfo] = useState(null)
  const [priceError, setPriceError] = useState(null)
  const [formData, setFormData] = useState({
    fromCityId: '',
    toCityId: '',
    price: '',
    isActive: true,
  })
  const latestPriceRef = useRef('')
  useEffect(() => {
    latestPriceRef.current = formData.price
  }, [formData.price])

  const cityById = useMemo(() => {
    const map = new Map()
    for (const c of cities) {
      map.set(String(c.cityId), c)
    }
    return map
  }, [cities])

  const getCityLabel = useCallback(
    (cityId) => {
      if (cityId == null || cityId === '') return ''
      const c = cityById.get(String(cityId))
      return c ? c.name : `#${cityId}`
    },
    [cityById]
  )

  const routeCellText = useCallback(
    (priceLine, role) => {
      const id =
        role === 'from'
          ? priceLine.fromCityId ?? priceLine.fromArea
          : priceLine.toCityId ?? priceLine.toArea
      if (id == null || id === '') return '—'
      return getCityLabel(id)
    },
    [getCityLabel]
  )

  useEffect(() => {
    fetchProviders()
    fetchCities()
  }, [])

  useEffect(() => {
    if (selectedProvider) {
      fetchPriceLines(selectedProvider.transportProviderId)
    }
  }, [selectedProvider])

  const fetchCities = async () => {
    try {
      setCitiesLoading(true)
      setCitiesLoadError(null)
      const list = await citiesService.getCities()
      setCities(list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })))
    } catch (err) {
      console.error('Failed to fetch cities:', err)
      setCities([])
      setCitiesLoadError(err.message || t('transport.priceLines.citiesLoadError'))
    } finally {
      setCitiesLoading(false)
    }
  }

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

  const checkGovernmentPrice = useCallback(async () => {
    if (!formData.fromCityId || !formData.toCityId) {
      setGovPriceInfo(null)
      return
    }

    const from = cityById.get(String(formData.fromCityId))
    const to = cityById.get(String(formData.toCityId))
    const fromGov = from?.governorateId
    const toGov = to?.governorateId

    if (fromGov == null || toGov == null) {
      setGovPriceInfo(null)
      return
    }

    try {
      setCheckingGovPrice(true)
      setPriceError(null)
      setGovPriceInfo(null)

      const response = await transportService.getOfficialPrice({
        fromRegion: String(fromGov),
        toRegion: String(toGov),
        distanceKm: 0,
        pricingType: 'government',
      })

      if (response) {
        setGovPriceInfo(response)
        const entered = latestPriceRef.current
        if (entered && Number(entered) > response.totalPrice) {
          setPriceError(
            `${t('transport.priceLines.priceExceedsGovMax')} ${formatMoney(response.totalPrice)}`
          )
        } else {
          setPriceError(null)
        }
      }
    } catch (err) {
      console.error('Failed to check government price:', err)
      setGovPriceInfo(null)
    } finally {
      setCheckingGovPrice(false)
    }
  }, [cityById, formData.fromCityId, formData.toCityId, t])

  useEffect(() => {
    if (!formData.fromCityId || !formData.toCityId) return
    const timer = setTimeout(() => {
      checkGovernmentPrice()
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.fromCityId, formData.toCityId, checkGovernmentPrice])

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
      fromCityId: '',
      toCityId: '',
      price: '',
      isActive: true,
    })
    setGovPriceInfo(null)
    setPriceError(null)
    setShowModal(true)
  }

  const handleEdit = (priceLine) => {
    setEditingPriceLine(priceLine)
    const fromId = priceLine.fromCityId ?? priceLine.fromArea
    const toId = priceLine.toCityId ?? priceLine.toArea
    setFormData({
      fromCityId: fromId != null ? String(fromId) : '',
      toCityId: toId != null ? String(toId) : '',
      price: priceLine.price != null ? String(priceLine.price) : '',
      isActive: priceLine.isActive !== false,
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
      setPriceLines(priceLines.filter((pl) => pl.priceLineId !== priceLineId))
      alert(t('transport.priceLines.deleteSuccess'))
    } catch (err) {
      console.error('Failed to delete price line:', err)
      alert(t('transport.priceLines.deleteError') + ': ' + (err.message || 'Unknown error'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProvider) return

    if (govPriceInfo && Number(formData.price) > govPriceInfo.totalPrice) {
      setPriceError(
        `${t('transport.priceLines.priceExceedsGovMax')} ${formatMoney(govPriceInfo.totalPrice)}`
      )
      return
    }

    try {
      const fromCityId = Number(formData.fromCityId)
      const toCityId = Number(formData.toCityId)
      const price = Number(formData.price)

      if (editingPriceLine) {
        await transportService.updatePriceLine(editingPriceLine.priceLineId, {
          fromCityId,
          toCityId,
          price,
          isActive: formData.isActive,
        })
        alert(t('transport.priceLines.updateSuccess'))
      } else {
        await transportService.createPriceLine({
          transportProviderId: selectedProvider.transportProviderId,
          fromCityId,
          toCityId,
          price,
        })
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

  const filteredPriceLines = priceLines.filter((pl) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const fromText = routeCellText(pl, 'from').toLowerCase()
    const toText = routeCellText(pl, 'to').toLowerCase()
    const ids = [pl.fromCityId, pl.toCityId, pl.fromArea, pl.toArea]
      .filter((x) => x != null)
      .map((x) => String(x).toLowerCase())
    return (
      ids.some((id) => id.includes(search)) ||
      fromText.includes(search) ||
      toText.includes(search) ||
      (pl.price && pl.price.toString().includes(search))
    )
  })

  const filteredProviders = providers.filter((provider) => {
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
                  <h3>
                    {t('transport.priceLines.priceLinesFor')} {selectedProvider.userName}
                  </h3>
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
                      <th>{t('transport.priceLines.fromCity')}</th>
                      <th>{t('transport.priceLines.toCity')}</th>
                      <th>{t('transport.priceLines.price')}</th>
                      <th>{t('transport.priceLines.govMaxPrice')}</th>
                      <th>{t('transport.priceLines.createdAt')}</th>
                      <th>{t('transport.priceLines.status')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPriceLines.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="no-data">
                          {t('transport.priceLines.noPriceLines')}
                        </td>
                      </tr>
                    ) : (
                      filteredPriceLines.map((priceLine) => (
                        <tr key={priceLine.priceLineId}>
                          <td>{routeCellText(priceLine, 'from')}</td>
                          <td>{routeCellText(priceLine, 'to')}</td>
                          <td>
                            {formatMoney(priceLine.price)}
                          </td>
                          <td>
                            {priceLine.governmentMaxPrice
                              ? formatMoney(priceLine.governmentMaxPrice)
                              : 'N/A'}
                          </td>
                          <td>
                            {priceLine.createdAt
                              ? new Date(priceLine.createdAt).toLocaleString()
                              : '—'}
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
                {editingPriceLine ? t('transport.priceLines.editPriceLine') : t('transport.priceLines.addPriceLine')}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {citiesLoadError && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>
                  <FiAlertCircle /> {citiesLoadError}
                </div>
              )}
              <div className="form-group">
                <label>{t('transport.priceLines.fromCity')} *</label>
                {citiesLoading ? (
                  <p className="checking-price">{t('transport.priceLines.loadingCities')}</p>
                ) : cities.length > 0 ? (
                  <select
                    value={formData.fromCityId}
                    onChange={(e) => setFormData({ ...formData, fromCityId: e.target.value })}
                    required
                  >
                    <option value="">{t('transport.priceLines.selectFromCity')}</option>
                    {cities.map((c) => (
                      <option key={c.cityId} value={String(c.cityId)}>
                        {c.name} (ID: {c.cityId})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={formData.fromCityId}
                    onChange={(e) => setFormData({ ...formData, fromCityId: e.target.value })}
                    required
                    placeholder={t('transport.priceLines.fromCityIdPlaceholder')}
                  />
                )}
              </div>
              <div className="form-group">
                <label>{t('transport.priceLines.toCity')} *</label>
                {citiesLoading ? (
                  <p className="checking-price">{t('transport.priceLines.loadingCities')}</p>
                ) : cities.length > 0 ? (
                  <select
                    value={formData.toCityId}
                    onChange={(e) => setFormData({ ...formData, toCityId: e.target.value })}
                    required
                  >
                    <option value="">{t('transport.priceLines.selectToCity')}</option>
                    {cities.map((c) => (
                      <option key={`to-${c.cityId}`} value={String(c.cityId)}>
                        {c.name} (ID: {c.cityId})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={formData.toCityId}
                    onChange={(e) => setFormData({ ...formData, toCityId: e.target.value })}
                    required
                    placeholder={t('transport.priceLines.toCityIdPlaceholder')}
                  />
                )}
              </div>

              {govPriceInfo && (
                <div className="gov-price-info">
                  <FiInfo />
                  <div>
                    <strong>{t('transport.priceLines.govPrice')}:</strong>
                    <span>
                      {formatMoney(govPriceInfo.totalPrice)}
                    </span>
                    {govPriceInfo.distanceKm ? (
                      <span className="gov-price-detail">
                        ({govPriceInfo.distanceKm} km × {formatMoneyPerUnit(govPriceInfo.pricePerKm, 'km')})
                      </span>
                    ) : null}
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
                      setPriceError(
                        `${t('transport.priceLines.priceExceedsGovMax')} ${formatMoney(govPriceInfo.totalPrice)}`
                      )
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
                    {t('transport.priceLines.checkingGovPrice')}
                  </span>
                )}
                {priceError && (
                  <span className="price-error">
                    <FiAlertCircle /> {priceError}
                  </span>
                )}
                {govPriceInfo && !priceError && formData.price && (
                  <span className="price-ok">
                    <FiCheck /> {t('transport.priceLines.priceWithinLimit')}
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
