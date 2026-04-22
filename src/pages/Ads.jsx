import React, { useEffect, useMemo, useState } from 'react'
import {
  FiCheck,
  FiEdit2,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiUpload,
  FiX,
} from 'react-icons/fi'
import advertisementsService from '../services/advertisementsService'
import imageService from '../services/imageService'
import './Ads.css'

const PLATFORM_OPTIONS = ['web', 'mobile', 'all']
const POSITION_OPTIONS = ['header', 'sidebar', 'footer', 'banner', 'popup']
const CLICK_ACTION_OPTIONS = ['url', 'product', 'category', 'auction', 'tender', 'listing']

/** Internal app routes from click action + target id (mobile/web deep links). */
const INTERNAL_ROUTE_BY_ACTION = {
  product: (id) => `/product/${id}`,
  category: (id) => `/category/${id}`,
  auction: (id) => `/auctions/${id}`,
  tender: (id) => `/tenders/${id}`,
  listing: (id) => `/listings/${id}`,
}

const INTERNAL_ROUTE_TEMPLATE_BY_ACTION = {
  product: '/product/{productId}',
  category: '/category/{categoryId}',
  auction: '/auctions/{auctionId}',
  tender: '/tenders/{tenderId}',
  listing: '/listings/{listingId}',
}

const buildInternalClickUrl = (clickAction, clickTargetId) => {
  if (!clickAction || clickAction === 'url') return null
  const id =
    clickTargetId === '' || clickTargetId === null || clickTargetId === undefined
      ? ''
      : String(clickTargetId).trim()
  if (!id) return INTERNAL_ROUTE_TEMPLATE_BY_ACTION[clickAction] || null
  const build = INTERNAL_ROUTE_BY_ACTION[clickAction]
  return build ? build(id) : null
}

const internalRoutePlaceholder = (clickAction) => {
  if (clickAction === 'url') return 'https://partner.example.com'
  return INTERNAL_ROUTE_TEMPLATE_BY_ACTION[clickAction] || '/product/{productId}'
}

const RECOMMENDED_IMAGE_WIDTH = 1200
const RECOMMENDED_IMAGE_HEIGHT = 300
const MIN_IMAGE_WIDTH = 800
const MIN_IMAGE_HEIGHT = 200
const IMAGE_RATIO_TARGET = 4
const IMAGE_RATIO_TOLERANCE = 0.05
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const RECOMMENDED_MAX_SIZE = 300 * 1024
const HARD_MAX_SIZE = 500 * 1024

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

/** Normalize API list/detail shapes into string URLs */
const collectMediaUrls = (value) => {
  if (!value) return []
  if (typeof value === 'string') {
    const t = value.trim()
    return t ? [t] : []
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === 'string') {
          const t = item.trim()
          return t ? [t] : []
        }
        if (item && typeof item === 'object') {
          const u = item.url || item.imageUrl || item.thumbnailUrl || item.uri || item.href
          return typeof u === 'string' && u.trim() ? [u.trim()] : []
        }
        return []
      })
      .filter(Boolean)
  }
  return []
}

const getImageUrlsFromAd = (ad) => {
  if (!ad || typeof ad !== 'object') return []
  const candidates = [
    ad.imageUrls,
    ad.ImageUrls,
    ad.images,
    ad.Images,
    ad.imageUrl,
    ad.imageURL,
    ad.ImageUrl,
  ]
  for (const c of candidates) {
    const urls = collectMediaUrls(c)
    if (urls.length) return urls
  }
  return []
}

const getThumbnailUrlsFromAd = (ad) => {
  if (!ad || typeof ad !== 'object') return []
  const candidates = [ad.thumbnailUrls, ad.ThumbnailUrls, ad.thumbnailUrl, ad.thumbnailURL, ad.ThumbnailUrl]
  for (const c of candidates) {
    const urls = collectMediaUrls(c)
    if (urls.length) return urls
  }
  return []
}

const Ads = () => {
  const [ads, setAds] = useState([])
  const [mobileAds, setMobileAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [previewError, setPreviewError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [selectedAd, setSelectedAd] = useState(null)
  const [formData, setFormData] = useState(createEmptyForm())
  const [formError, setFormError] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [thumbnailFiles, setThumbnailFiles] = useState([])
  const [uploadWarning, setUploadWarning] = useState('')

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
      setPreviewError('')

      const [adminAdsResult, mobileAdsResult] = await Promise.allSettled([
        advertisementsService.getAdvertisements(),
        advertisementsService.getAppAdvertisements(true),
      ])

      if (adminAdsResult.status === 'fulfilled') {
        setAds(Array.isArray(adminAdsResult.value) ? adminAdsResult.value : [])
      } else {
        setAds([])
        setError(adminAdsResult.reason?.message || 'Failed to load ads')
      }

      if (mobileAdsResult.status === 'fulfilled') {
        setMobileAds(Array.isArray(mobileAdsResult.value) ? mobileAdsResult.value : [])
      } else {
        setMobileAds([])
        setPreviewError(
          mobileAdsResult.reason?.message ||
            'Mobile preview endpoint is unavailable (possibly blocked by browser extension).'
        )
      }
    } catch (err) {
      setError(err.message || 'Failed to load ads')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setSelectedAd(null)
    setFormData(createEmptyForm())
    setFormError('')
    setImageFiles([])
    setThumbnailFiles([])
    setUploadWarning('')
    setShowModal(true)
  }

  const openEditModal = async (ad) => {
    setFormError('')
    setImageFiles([])
    setThumbnailFiles([])
    setUploadWarning('')

    let imageUrls = getImageUrlsFromAd(ad)
    let thumbnailUrls = getThumbnailUrlsFromAd(ad)
    const adId = ad.advertisementId ?? ad.id

    if ((!imageUrls.length || !thumbnailUrls.length) && adId != null) {
      try {
        const detail = await advertisementsService.getAdvertisementById(adId)
        const record =
          detail && typeof detail === 'object' && !Array.isArray(detail) ? detail : ad
        if (!imageUrls.length) imageUrls = getImageUrlsFromAd(record)
        if (!thumbnailUrls.length) thumbnailUrls = getThumbnailUrlsFromAd(record)
      } catch {
        // keep list-row values
      }
    }

    // Keep resolved URLs on selectedAd so updates can reuse media without re-uploading
    setSelectedAd({ ...ad, imageUrls, thumbnailUrls })

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
      imageUrlsText: imageUrls.join('\n'),
      thumbnailUrlsText: thumbnailUrls.join('\n'),
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedAd(null)
    setFormError('')
    setImageFiles([])
    setThumbnailFiles([])
    setUploadWarning('')
    setFormData(createEmptyForm())
  }

  const parseUrlLines = (text) =>
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  const isAllowedImageFormat = (url) => {
    const sanitized = url.split('?')[0].toLowerCase()
    return ALLOWED_IMAGE_EXTENSIONS.some((extension) => sanitized.endsWith(extension))
  }

  const isAllowedFileFormat = (file) =>
    ALLOWED_IMAGE_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))

  const getImageDimensionsFromFile = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error(`Unable to read image "${file.name}".`))
      }
      img.src = objectUrl
    })

  const extractUploadedUrl = (uploadResponse) => {
    if (uploadResponse?.data?.url) return uploadResponse.data.url
    if (uploadResponse?.data?.data?.url) return uploadResponse.data.data.url
    if (uploadResponse?.url) return uploadResponse.url
    if (typeof uploadResponse?.data === 'string') return uploadResponse.data
    return null
  }

  const validateSelectedFiles = async (files) => {
    for (const file of files) {
      if (!isAllowedFileFormat(file)) {
        return `File "${file.name}" must be JPG, PNG, or WEBP.`
      }
      if (file.size > HARD_MAX_SIZE) {
        return `File "${file.name}" exceeds hard limit (500KB).`
      }

      const { width, height } = await getImageDimensionsFromFile(file)
      const ratio = width / height
      if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
        return `File "${file.name}" is too small (${width}x${height}). Minimum is ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}.`
      }
      if (Math.abs(ratio - IMAGE_RATIO_TARGET) > IMAGE_RATIO_TOLERANCE) {
        return `File "${file.name}" must use 4:1 ratio. Current ratio is ${ratio.toFixed(2)}:1.`
      }
    }
    return ''
  }

  const uploadFilesAndGetUrls = async (files) => {
    const urls = []
    for (const file of files) {
      const uploadResponse = await imageService.uploadImage(file, 'ads')
      const uploadedUrl = extractUploadedUrl(uploadResponse)
      if (!uploadedUrl) {
        throw new Error(`Upload failed for "${file.name}". No URL in response.`)
      }
      urls.push(uploadedUrl)
    }
    return urls
  }

  const validateImageDimensions = (url, useCrossOrigin = false) =>
    new Promise((resolve) => {
      const img = new Image()
      if (useCrossOrigin) {
        img.crossOrigin = 'anonymous'
      }

      img.onload = () => {
        const width = img.naturalWidth
        const height = img.naturalHeight
        const ratio = width / height
        const hasMinResolution = width >= MIN_IMAGE_WIDTH && height >= MIN_IMAGE_HEIGHT
        const hasRequiredRatio = Math.abs(ratio - IMAGE_RATIO_TARGET) <= IMAGE_RATIO_TOLERANCE
        const isRecommended = width >= RECOMMENDED_IMAGE_WIDTH && height >= RECOMMENDED_IMAGE_HEIGHT

        resolve({
          ok: hasMinResolution && hasRequiredRatio,
          hasMinResolution,
          hasRequiredRatio,
          isRecommended,
          width,
          height,
        })
      }

      img.onerror = () => {
        resolve({
          ok: false,
          loadError: true,
        })
      }

      img.src = url
    })

  /**
   * Remote URL checks can fail even when the URL is valid (ad blockers on `/ads/`,
   * CORP/CORS, hotlink rules, etc.). Uploaded files are still validated strictly.
   */
  const validateImageSpecs = async (imageUrls) => {
    const warnings = []

    for (const url of imageUrls) {
      if (!isAllowedImageFormat(url)) {
        return { error: 'Image format must be JPG, PNG, or WEBP.', warnings }
      }

      let imageCheck = await validateImageDimensions(url, false)
      if (imageCheck.loadError) {
        imageCheck = await validateImageDimensions(url, true)
      }

      if (imageCheck.loadError) {
        warnings.push(
          `Could not load image in the browser to verify size/ratio: ${url}. If the file is correct, you can still save — confirm 4:1 ratio and min ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT} (e.g. ad blockers often block URLs containing "/ads/").`
        )
        continue
      }

      if (!imageCheck.hasMinResolution) {
        return {
          error: `Image "${url}" is too small (${imageCheck.width}x${imageCheck.height}). Minimum is ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}.`,
          warnings,
        }
      }

      if (!imageCheck.hasRequiredRatio) {
        return {
          error: `Image "${url}" must use 4:1 aspect ratio. Current ratio is ${(imageCheck.width / imageCheck.height).toFixed(2)}:1.`,
          warnings,
        }
      }
    }

    return { error: '', warnings }
  }

  const validateForm = async () => {
    const requiredFields = ['title', 'platform', 'position', 'displayOrder', 'startDate']
    const missingField = requiredFields.find((field) => !formData[field] && formData[field] !== 0)
    if (missingField) {
      return 'Please fill all required fields.'
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

    let clickUrl = formData.clickUrl?.trim() || null
    if (formData.clickAction && formData.clickAction !== 'url') {
      const auto = buildInternalClickUrl(formData.clickAction, formData.clickTargetId)
      if (auto) clickUrl = auto
    }

    return {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      platform: formData.platform,
      position: formData.position,
      isSlider: Boolean(formData.isSlider),
      displayOrder: Number(formData.displayOrder),
      clickUrl,
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
    setFormError('')
    setUploadWarning('')

    const fromFormImages = parseUrlLines(formData.imageUrlsText)
    const fromFormThumbs = parseUrlLines(formData.thumbnailUrlsText)
    const persistedImages = selectedAd ? getImageUrlsFromAd(selectedAd) : []
    const persistedThumbs = selectedAd ? getThumbnailUrlsFromAd(selectedAd) : []

    const existingImageUrls = fromFormImages.length > 0 ? fromFormImages : persistedImages
    const existingThumbUrls = fromFormThumbs.length > 0 ? fromFormThumbs : persistedThumbs

    if (!existingImageUrls.length && imageFiles.length === 0) {
      setFormError('Please upload at least one image or provide at least one image URL.')
      return
    }

    const fileValidationError = await validateSelectedFiles([...imageFiles, ...thumbnailFiles])
    if (fileValidationError) {
      setFormError(fileValidationError)
      return
    }

    const largeFile = [...imageFiles, ...thumbnailFiles].find(
      (file) => file.size > RECOMMENDED_MAX_SIZE && file.size <= HARD_MAX_SIZE
    )
    if (largeFile) {
      setUploadWarning(
        `"${largeFile.name}" is above recommended 300KB but within hard limit 500KB.`
      )
    }

    const validationError = await validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      setSaving(true)
      const uploadedImageUrls = imageFiles.length ? await uploadFilesAndGetUrls(imageFiles) : []
      const uploadedThumbUrls = thumbnailFiles.length
        ? await uploadFilesAndGetUrls(thumbnailFiles)
        : []
      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls]
      const finalThumbUrls = [...existingThumbUrls, ...uploadedThumbUrls]

      const { error: imageSpecError, warnings: imageSpecWarnings } =
        await validateImageSpecs(finalImageUrls)
      if (imageSpecError) {
        setFormError(imageSpecError)
        return
      }
      if (imageSpecWarnings.length > 0) {
        setUploadWarning((prev) =>
          [prev, ...imageSpecWarnings].filter(Boolean).join('\n\n')
        )
      }

      const payload = buildPayload()
      payload.imageUrls = finalImageUrls
      payload.thumbnailUrls = finalThumbUrls

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
      setFormError(err.message || 'Failed to save ad')
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
        {previewError && <div className="preview-error">{previewError}</div>}
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
                    onChange={(e) => {
                      const clickAction = e.target.value
                      setFormData((prev) => {
                        const next = { ...prev, clickAction }
                        if (clickAction === 'url') return next
                        const built = buildInternalClickUrl(clickAction, prev.clickTargetId)
                        next.clickUrl = built || ''
                        return next
                      })
                    }}
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
                    placeholder={internalRoutePlaceholder(formData.clickAction)}
                  />
                </div>
                <div className="form-group">
                  <label>Click Target ID</label>
                  <input
                    type="number"
                    value={formData.clickTargetId}
                    onChange={(e) => {
                      const clickTargetId = e.target.value
                      setFormData((prev) => {
                        const next = { ...prev, clickTargetId }
                        if (prev.clickAction === 'url') return next
                        const built = buildInternalClickUrl(prev.clickAction, clickTargetId)
                        next.clickUrl = built || ''
                        return next
                      })
                    }}
                    placeholder="12345"
                  />
                </div>
              </div>
              {formData.clickAction !== 'url' && (
                <p className="spec-note">
                  Internal route is filled automatically from Target ID (e.g. auction →{' '}
                  <code>/auctions/3</code>). You can still edit the route field if needed.
                </p>
              )}

              <h3>Media</h3>
              {selectedAd && (
                <p className="spec-note edit-media-hint">
                  Existing images stay on the ad until you upload new files or change the URL list below.
                </p>
              )}
              <div className="form-group">
                <label>
                  {selectedAd ? 'Upload new images (optional)' : 'Upload Images * (JPG/PNG/WEBP)'}
                </label>
                <label className="upload-input">
                  <FiUpload /> Select one or more image files
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                  />
                </label>
                {imageFiles.length > 0 && (
                  <p className="file-summary">{imageFiles.length} image file(s) selected</p>
                )}
              </div>
              <div className="form-group">
                <label>Upload Thumbnails (optional)</label>
                <label className="upload-input">
                  <FiUpload /> Select thumbnail file(s)
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => setThumbnailFiles(Array.from(e.target.files || []))}
                  />
                </label>
                {thumbnailFiles.length > 0 && (
                  <p className="file-summary">{thumbnailFiles.length} thumbnail file(s) selected</p>
                )}
              </div>
              <div className="form-group">
                <label>Image URLs (optional, one URL per line)</label>
                <textarea
                  rows={4}
                  value={formData.imageUrlsText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, imageUrlsText: e.target.value }))}
                  placeholder="https://cdn.example.com/ad-main.jpg"
                />
                <small className="spec-note">
                  Display size in app: 96px height (full width). Required: 4:1 ratio, minimum
                  800x200, recommended 1200x300, JPG/PNG/WEBP. If the URL is valid but verification
                  fails, some extensions block paths like <code>/ads/</code> — use file upload or
                  allowlist this domain.
                </small>
              </div>
              <div className="form-group">
                <label>Thumbnail URLs (one URL per line)</label>
                <textarea
                  rows={3}
                  value={formData.thumbnailUrlsText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, thumbnailUrlsText: e.target.value }))}
                  placeholder="https://cdn.example.com/ad-thumb.jpg"
                />
                <small className="spec-note">
                  File size policy: target 300KB max, hard limit 500KB (must be enforced by your
                  uploader/backend).
                </small>
              </div>

              {parseUrlLines(formData.imageUrlsText)[0] && (
                <div className="ad-preview">
                  <p>Primary image preview (first image URL):</p>
                  <img src={parseUrlLines(formData.imageUrlsText)[0]} alt="Primary ad preview" />
                </div>
              )}

              {formError && <div className="form-error">{formError}</div>}
              {uploadWarning && <div className="upload-warning">{uploadWarning}</div>}

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
