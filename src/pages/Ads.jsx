import React, { useEffect, useMemo, useState } from 'react'
import {
  FiCheck,
  FiEdit2,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import advertisementsService from '../services/advertisementsService'
import './Ads.css'

const PLATFORM_OPTIONS = ['web', 'mobile', 'all']
const POSITION_OPTIONS = ['header', 'sidebar', 'footer', 'banner', 'popup']
const CLICK_ACTION_OPTIONS = ['url', 'product', 'category', 'auction', 'tender', 'listing']

const createEmptyForm = () => ({
  title: '',
  description: '',
  platform: 'mobile',
  position: 'banner',
  isSlider: false,
  displayOrder: 1,
  clickAction: 'url',
  clickUrl: '',
  clickTargetId: '',
  startDate: '',
  endDate: '',
  isActive: true,
  imageUrlsText: '',
  thumbnailUrlsText: '',
})

const toDateInputValue = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const Ads = () => {
  const [ads, setAds] = useState([])
  const [mobileAds, setMobileAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [selectedAd, setSelectedAd] = useState(null)
  const [formData, setFormData] = useState(createEmptyForm())

  const [filters, setFilters] = useState({
    platform: 'all',
    position: 'all',
    active: 'all',
    from: '',
    to: '',
    search: '',
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError('')
      const [allAds, enabledMobileAds] = await Promise.all([
        advertisementsService.getAdvertisements(),
        advertisementsService.getAppAdvertisements(true),
      ])
      setAds(Array.isArray(allAds) ? allAds : [])
      setMobileAds(Array.isArray(enabledMobileAds) ? enabledMobileAds : [])
    } catch (err) {
      setError(err.message || 'Failed to load ads')
      setAds([])
      setMobileAds([])
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setSelectedAd(null)
    setFormData(createEmptyForm())
    setShowModal(true)
  }

  const openEditModal = (ad) => {
    setSelectedAd(ad)
    setFormData({
      title: ad.title || '',
      description: ad.description || '',
      platform: ad.platform || 'mobile',
      position: ad.position || 'banner',
      isSlider: !!ad.isSlider,
      displayOrder: Number(ad.displayOrder ?? 1),
      clickAction: ad.clickAction || 'url',
      clickUrl: ad.clickUrl || '',
      clickTargetId: ad.clickTargetId ?? '',
      startDate: toDateInputValue(ad.startDate),
      endDate: toDateInputValue(ad.endDate),
      isActive: ad.isActive ?? true,
      imageUrlsText: Array.isArray(ad.imageUrls) ? ad.imageUrls.join('\n') : '',
      thumbnailUrlsText: Array.isArray(ad.thumbnailUrls) ? ad.thumbnailUrls.join('\n') : '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedAd(null)
    setFormData(createEmptyForm())
  }

  const parseUrlLines = (text) =>
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  const validateForm = () => {
    const requiredFields = ['title', 'platform', 'position', 'displayOrder', 'startDate']
    const missingField = requiredFields.find((field) => !formData[field] && formData[field] !== 0)
    if (missingField) {
      return 'Please fill all required fields.'
    }

    const imageUrls = parseUrlLines(formData.imageUrlsText)
    if (!imageUrls.length) {
      return 'At least one image URL is required.'
    }

    if (formData.clickAction === 'url') {
      try {
        const parsed = new URL(formData.clickUrl)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return 'External URL must start with http:// or https://.'
        }
      } catch {
        return 'For external navigation, Click URL must be a valid absolute URL.'
      }
    } else if (!formData.clickUrl && !formData.clickTargetId) {
      return 'For internal navigation, provide Click URL or Click Target ID.'
    }

    return ''
  }

  const buildPayload = () => {
    const imageUrls = parseUrlLines(formData.imageUrlsText)
    const thumbnailUrls = parseUrlLines(formData.thumbnailUrlsText)

    return {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      platform: formData.platform,
      position: formData.position,
      isSlider: Boolean(formData.isSlider),
      displayOrder: Number(formData.displayOrder),
      clickUrl: formData.clickUrl?.trim() || null,
      clickAction: formData.clickAction?.trim() || null,
      clickTargetId:
        formData.clickTargetId === '' || formData.clickTargetId === null
          ? null
          : Number(formData.clickTargetId),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      isActive: Boolean(formData.isActive),
      imageUrls,
      thumbnailUrls,
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      alert(validationError)
      return
    }

    try {
      setSaving(true)
      const payload = buildPayload()

      if (selectedAd) {
        await advertisementsService.updateAdvertisement(
          selectedAd.advertisementId || selectedAd.id,
          payload
        )
        alert('Ad updated successfully.')
      } else {
        await advertisementsService.createAdvertisement(payload)
        alert('Ad created successfully.')
      }

      closeModal()
      fetchAll()
    } catch (err) {
      alert(err.message || 'Failed to save ad')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ad) => {
    const adId = ad.advertisementId || ad.id
    if (!window.confirm(`Delete ad "${ad.title || adId}"?`)) return

    try {
      await advertisementsService.deleteAdvertisement(adId)
      fetchAll()
    } catch (err) {
      alert(err.message || 'Failed to delete ad')
    }
  }

  const handleToggleActive = async (ad) => {
    const adId = ad.advertisementId || ad.id
    try {
      await advertisementsService.updateAdvertisement(adId, { isActive: !ad.isActive })
      fetchAll()
    } catch (err) {
      alert(err.message || 'Failed to update status')
    }
  }

  const filteredAds = useMemo(() => {
    const search = filters.search.toLowerCase().trim()

    return [...ads]
      .filter((ad) => {
        if (filters.platform !== 'all' && ad.platform !== filters.platform) return false
        if (filters.position !== 'all' && ad.position !== filters.position) return false
        if (filters.active === 'active' && !ad.isActive) return false
        if (filters.active === 'inactive' && ad.isActive) return false

        if (filters.from && ad.startDate && new Date(ad.startDate) < new Date(filters.from)) return false
        if (filters.to && ad.startDate && new Date(ad.startDate) > new Date(filters.to)) return false

        if (!search) return true
        const target = `${ad.title || ''} ${ad.description || ''} ${ad.clickUrl || ''}`.toLowerCase()
        return target.includes(search)
      })
      .sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0))
  }, [ads, filters])

  return (
    <div className="ads-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiImage /> Ads Management
          </h1>
          <p className="page-subtitle">Create, sort, and schedule mobile/web ads</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchAll}>
            <FiRefreshCw /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <FiPlus /> Add Ad
          </button>
        </div>
      </div>

      <div className="card filters-card">
        <input
          type="text"
          placeholder="Search by title, description, or URL"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
        />
        <select
          value={filters.platform}
          onChange={(e) => setFilters((prev) => ({ ...prev, platform: e.target.value }))}
        >
          <option value="all">All Platforms</option>
          {PLATFORM_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={filters.position}
          onChange={(e) => setFilters((prev) => ({ ...prev, position: e.target.value }))}
        >
          <option value="all">All Positions</option>
          {POSITION_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={filters.active}
          onChange={(e) => setFilters((prev) => ({ ...prev, active: e.target.value }))}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
        />
      </div>

      {error && <div className="card error-message">{error}</div>}

      {loading ? (
        <div className="card">Loading ads...</div>
      ) : (
        <div className="card table-wrapper">
          <table className="ads-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Title</th>
                <th>Platform</th>
                <th>Position</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-row">
                    No ads found.
                  </td>
                </tr>
              ) : (
                filteredAds.map((ad) => (
                  <tr key={ad.advertisementId || ad.id}>
                    <td>{ad.displayOrder ?? 0}</td>
                    <td>
                      <div className="ad-title-cell">
                        <strong>{ad.title || 'Untitled'}</strong>
                        <span>{ad.description || '-'}</span>
                      </div>
                    </td>
                    <td>{ad.platform || '-'}</td>
                    <td>{ad.position || '-'}</td>
                    <td>
                      <span>{ad.startDate ? new Date(ad.startDate).toLocaleDateString() : '-'}</span>
                      <span> - </span>
                      <span>{ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'No expiry'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${ad.isActive ? 'status-active' : 'status-inactive'}`}>
                        {ad.isActive ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" onClick={() => handleToggleActive(ad)} title="Toggle status">
                          {ad.isActive ? <FiX /> : <FiCheck />}
                        </button>
                        <button className="btn-icon btn-primary" onClick={() => openEditModal(ad)} title="Edit">
                          <FiEdit2 />
                        </button>
                        <button className="btn-icon btn-danger" onClick={() => handleDelete(ad)} title="Delete">
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
      )}

      <div className="card mobile-preview-card">
        <h2>Mobile Endpoint Preview (`GET /api/advertisement/app?enabledOnly=true`)</h2>
        <div className="mobile-preview-grid">
          {mobileAds.length === 0 ? (
            <p>No enabled mobile ads returned.</p>
          ) : (
            mobileAds.map((ad) => (
              <div key={ad.advertisementId} className="mobile-ad-card">
                <img src={ad.imageUrl} alt={ad.title || 'Ad image'} />
                <div className="mobile-ad-content">
                  <h3>{ad.title}</h3>
                  <p>{ad.description || '-'}</p>
                  <small>
                    {ad.navigationType}: {ad.navigationValue}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content ad-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAd ? 'Edit Ad' : 'Create Ad'}</h2>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <h3>Basic Info</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <h3>Placement</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Platform *</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData((prev) => ({ ...prev, platform: e.target.value }))}
                    required
                  >
                    {PLATFORM_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Position *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                    required
                  >
                    {POSITION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Display Order *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>Slider Ad</label>
                  <input
                    type="checkbox"
                    checked={formData.isSlider}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isSlider: e.target.checked }))}
                  />
                </div>
              </div>

              <h3>Schedule & Status</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>Enabled (isActive)</label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                </div>
              </div>

              <h3>Navigation</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Click Action *</label>
                  <select
                    value={formData.clickAction}
                    onChange={(e) => setFormData((prev) => ({ ...prev, clickAction: e.target.value }))}
                  >
                    {CLICK_ACTION_OPTIONS.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{formData.clickAction === 'url' ? 'External URL *' : 'Internal Route'}</label>
                  <input
                    type="text"
                    value={formData.clickUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, clickUrl: e.target.value }))}
                    placeholder={
                      formData.clickAction === 'url'
                        ? 'https://partner.example.com'
                        : '/product/12345'
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Click Target ID</label>
                  <input
                    type="number"
                    value={formData.clickTargetId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, clickTargetId: e.target.value }))}
                    placeholder="12345"
                  />
                </div>
              </div>

              <h3>Media</h3>
              <div className="form-group">
                <label>Image URLs * (one URL per line)</label>
                <textarea
                  rows={4}
                  value={formData.imageUrlsText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, imageUrlsText: e.target.value }))}
                  placeholder="https://cdn.example.com/ad-main.jpg"
                  required
                />
              </div>
              <div className="form-group">
                <label>Thumbnail URLs (one URL per line)</label>
                <textarea
                  rows={3}
                  value={formData.thumbnailUrlsText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, thumbnailUrlsText: e.target.value }))}
                  placeholder="https://cdn.example.com/ad-thumb.jpg"
                />
              </div>

              {parseUrlLines(formData.imageUrlsText)[0] && (
                <div className="ad-preview">
                  <p>Primary image preview (first image URL):</p>
                  <img src={parseUrlLines(formData.imageUrlsText)[0]} alt="Primary ad preview" />
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : selectedAd ? 'Update Ad' : 'Create Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ads
