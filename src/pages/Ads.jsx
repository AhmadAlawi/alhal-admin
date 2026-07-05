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
import adminService from '../services/adminService'
import imageService from '../services/imageService'
import { useTranslation } from '../hooks/useTranslation'
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

/** Matches mobile APP_AD_DEFAULT_COLORS (BannerCarousel / BottomAdStrip) */
const APP_AD_DEFAULT_COLORS = {
  title: '#4ade80',
  subtitle: '#ffffff',
  ctaBg: '#047857',
  ctaText: '#ffffff',
}

const DEFAULT_TITLE_COLOR = APP_AD_DEFAULT_COLORS.title
const DEFAULT_SUBTITLE_COLOR = APP_AD_DEFAULT_COLORS.subtitle
const DEFAULT_CTA_BG = APP_AD_DEFAULT_COLORS.ctaBg
const DEFAULT_CTA_TEXT = APP_AD_DEFAULT_COLORS.ctaText
const DEFAULT_BUTTON_LABEL = 'اعرف المزيد'

const previewVariantFromAd = (ad) => {
  const p = String(ad?.position ?? ad?.Position ?? '').toLowerCase()
  if (p === 'footer' || p === 'bottom') return 'bottom'
  return 'banner'
}

const pickAdString = (ad, camel, pascal, fallback = '') => {
  const raw = ad?.[camel] ?? ad?.[pascal]
  if (raw === null || raw === undefined) return fallback
  const s = String(raw).trim()
  return s || fallback
}

const pickAdColor = (ad, camel, pascal, fallback) =>
  pickAdString(ad, camel, pascal, fallback)

const hexForColorInput = (val) => {
  const s = String(val || '').trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`
  }
  return '#000000'
}

const formatAdMetric = (ad, camel, pascal) => {
  const v = ad?.[camel] ?? ad?.[pascal]
  if (v === null || v === undefined) return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString() : '—'
}

/** Normalize admin row or public AppAdView into preview props */
const toAppPreviewProps = (ad) => {
  if (!ad || typeof ad !== 'object') return null
  const imageUrl =
    ad.imageUrl ||
    ad.ImageUrl ||
    getImageUrlsFromAd(ad)[0] ||
    ''
  return {
    advertisementId: ad.advertisementId ?? ad.id ?? ad.Id,
    title: pickAdString(ad, 'title', 'Title', ''),
    description: pickAdString(ad, 'description', 'Description', ''),
    imageUrl,
    titleColor: pickAdColor(ad, 'titleColor', 'TitleColor', DEFAULT_TITLE_COLOR),
    subtitleColor: pickAdColor(ad, 'subtitleColor', 'SubtitleColor', DEFAULT_SUBTITLE_COLOR),
    ctaBackgroundColor: pickAdColor(ad, 'ctaBackgroundColor', 'CtaBackgroundColor', DEFAULT_CTA_BG),
    ctaTextColor: pickAdColor(ad, 'ctaTextColor', 'CtaTextColor', DEFAULT_CTA_TEXT),
    buttonLabel: pickAdString(ad, 'buttonLabel', 'ButtonLabel', DEFAULT_BUTTON_LABEL),
    navigationType: ad.navigationType ?? ad.NavigationType,
    navigationValue: ad.navigationValue ?? ad.NavigationValue,
  }
}

/** BannerCarousel: h-24, mx-4, rounded-2xl, overlay 30%, RTL row + CTA */
const AppAdPreviewBanner = ({
  title,
  description,
  imageUrl,
  titleColor,
  subtitleColor,
  ctaBackgroundColor,
  ctaTextColor,
  buttonLabel,
  placeholder,
}) => {
  const tColor = titleColor || APP_AD_DEFAULT_COLORS.title
  const sColor = subtitleColor || APP_AD_DEFAULT_COLORS.subtitle
  const bg = ctaBackgroundColor || APP_AD_DEFAULT_COLORS.ctaBg
  const tc = ctaTextColor || APP_AD_DEFAULT_COLORS.ctaText

  return (
    <div className="ad-prev-banner">
      <div className="ad-prev-banner__mx">
        <div className="ad-prev-banner__my">
          <div className="ad-prev-banner__card">
            {imageUrl ? (
              <img
                className="ad-prev-banner__img"
                src={imageUrl}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="ad-prev-banner__ph">{placeholder || 'أضف صورة للمعاينة'}</div>
            )}
            <div className="ad-prev-banner__shade" />
            <div className="ad-prev-banner__row" dir="rtl">
              <div className="ad-prev-banner__copy">
                <h2 className="ad-prev-banner__title cairo-banner-title" style={{ color: tColor }}>
                  {title || 'عنوان'}
                </h2>
                <p className="ad-prev-banner__sub" style={{ color: sColor }}>
                  {description || 'وصف قصير'}
                </p>
              </div>
              <div className="ad-prev-banner__cta-col">
                <button
                  type="button"
                  className="ad-prev-banner__cta cairo-banner-btn"
                  style={{ backgroundColor: bg, color: tc }}
                >
                  {buttonLabel || DEFAULT_BUTTON_LABEL}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** BottomAdStrip: 260×76, overlay 35%, text only, no button */
const AppAdPreviewBottom = ({
  title,
  description,
  imageUrl,
  titleColor,
  subtitleColor,
  placeholder,
}) => {
  const tColor = titleColor || APP_AD_DEFAULT_COLORS.title
  const sColor = subtitleColor || APP_AD_DEFAULT_COLORS.subtitle

  return (
    <div className="ad-prev-bottom-wrap">
      <div className="ad-prev-bottom-scroll">
        <div className="ad-prev-bottom-card">
          {imageUrl ? (
            <img
              className="ad-prev-bottom__img"
              src={imageUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="ad-prev-bottom__ph">{placeholder || 'أضف صورة للمعاينة'}</div>
          )}
          <div className="ad-prev-bottom__shade" />
          <div className="ad-prev-bottom__copy" dir="rtl">
            <p className="ad-prev-bottom__title cairo-bottom-title" style={{ color: tColor }}>
              {title || 'عنوان'}
            </p>
            <p className="ad-prev-bottom__desc" style={{ color: sColor }}>
              {description || 'وصف قصير قد يمتد لسطر ثاني في الشريط السفلي'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const AppAdPreviewByVariant = ({ variant, navigationType, navigationValue, ...rest }) => (
  <>
    {variant === 'bottom' ? (
      <AppAdPreviewBottom {...rest} />
    ) : (
      <AppAdPreviewBanner {...rest} />
    )}
    {(navigationType != null || navigationValue != null) &&
      String(navigationType || navigationValue || '').length > 0 && (
        <div className="ad-prev-meta">
          {navigationType != null && navigationValue != null
            ? `${navigationType}: ${navigationValue}`
            : String(navigationValue ?? navigationType ?? '')}
        </div>
      )}
  </>
)

const pickProductCategoryId = (ad) => {
  const raw = ad?.productCategoryId ?? ad?.ProductCategoryId
  if (raw == null || raw === '') return ''
  return String(raw)
}

const createEmptyForm = () => ({
  title: '',
  description: '',
  productCategoryId: '',
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
  titleColor: DEFAULT_TITLE_COLOR,
  subtitleColor: DEFAULT_SUBTITLE_COLOR,
  ctaBackgroundColor: DEFAULT_CTA_BG,
  ctaTextColor: DEFAULT_CTA_TEXT,
  buttonLabel: DEFAULT_BUTTON_LABEL,
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

const parseUrlLines = (text) =>
  String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

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
  const { t } = useTranslation()
  const [ads, setAds] = useState([])
  const [productCategories, setProductCategories] = useState([])
  const [mobileAds, setMobileAds] = useState([])
  const [mobileBottomAds, setMobileBottomAds] = useState([])
  const [mobileHeaderAds, setMobileHeaderAds] = useState([])
  const [previewCategoryId, setPreviewCategoryId] = useState('')
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
  const [filePreviewUrl, setFilePreviewUrl] = useState('')
  const [modalPreviewVariant, setModalPreviewVariant] = useState('banner')

  const [filters, setFilters] = useState({
    platform: 'all',
    position: 'all',
    active: 'all',
    productCategoryId: 'all',
    from: '',
    to: '',
    search: '',
  })

  const categoryNameById = useMemo(() => {
    const map = new Map()
    productCategories.forEach((c) => {
      const id = c.categoryId ?? c.id
      if (id != null) {
        map.set(String(id), c.nameAr || c.nameEn || c.name || `#${id}`)
      }
    })
    return map
  }, [productCategories])

  const categoryLabel = (categoryId) => {
    if (categoryId == null || categoryId === '') return t('ads.globalAd')
    return categoryNameById.get(String(categoryId)) || `#${categoryId}`
  }

  useEffect(() => {
    fetchAll()
    adminService
      .getCategories({ isActive: true })
      .then((res) => setProductCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProductCategories([]))
  }, [])

  useEffect(() => {
    fetchMobilePreviews()
  }, [previewCategoryId])

  useEffect(() => {
    if (!imageFiles.length) {
      setFilePreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(imageFiles[0])
    setFilePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFiles])

  useEffect(() => {
    if (!showModal) return
    setModalPreviewVariant(previewVariantFromAd({ position: formData.position }))
  }, [formData.position, showModal])

  const primaryPreviewUrl = useMemo(() => {
    const line = parseUrlLines(formData.imageUrlsText)[0]
    if (line) return line
    if (filePreviewUrl) return filePreviewUrl
    if (selectedAd) return getImageUrlsFromAd(selectedAd)[0] || ''
    return ''
  }, [formData.imageUrlsText, filePreviewUrl, selectedAd])

  const modalLivePreview = useMemo(
    () => ({
      title: formData.title,
      description: formData.description,
      imageUrl: primaryPreviewUrl,
      titleColor: formData.titleColor || DEFAULT_TITLE_COLOR,
      subtitleColor: formData.subtitleColor || DEFAULT_SUBTITLE_COLOR,
      ctaBackgroundColor: formData.ctaBackgroundColor || DEFAULT_CTA_BG,
      ctaTextColor: formData.ctaTextColor || DEFAULT_CTA_TEXT,
      buttonLabel: formData.buttonLabel || DEFAULT_BUTTON_LABEL,
    }),
    [
      formData.title,
      formData.description,
      formData.titleColor,
      formData.subtitleColor,
      formData.ctaBackgroundColor,
      formData.ctaTextColor,
      formData.buttonLabel,
      primaryPreviewUrl,
    ]
  )

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError('')
      setPreviewError('')

      const [adminAdsResult] = await Promise.allSettled([advertisementsService.getAdvertisements()])

      if (adminAdsResult.status === 'fulfilled') {
        setAds(Array.isArray(adminAdsResult.value) ? adminAdsResult.value : [])
      } else {
        setAds([])
        setError(adminAdsResult.reason?.message || 'Failed to load ads')
      }

      await fetchMobilePreviews()
    } catch (err) {
      setError(err.message || 'Failed to load ads')
    } finally {
      setLoading(false)
    }
  }

  const fetchMobilePreviews = async () => {
    const categoryParam = previewCategoryId || undefined
    setPreviewError('')
    const [appResult, bottomResult, headerResult] = await Promise.allSettled([
      advertisementsService.getAppAdvertisements({
        enabledOnly: true,
        productCategoryId: categoryParam,
      }),
      advertisementsService.getAppBottomAdvertisements(categoryParam),
      advertisementsService.getMobileHeaderAds(categoryParam),
    ])

    if (appResult.status === 'fulfilled') {
      setMobileAds(Array.isArray(appResult.value) ? appResult.value : [])
    } else {
      setMobileAds([])
      setPreviewError(appResult.reason?.message || 'Mobile app ads preview failed.')
    }

    if (bottomResult.status === 'fulfilled') {
      setMobileBottomAds(Array.isArray(bottomResult.value) ? bottomResult.value : [])
    } else {
      setMobileBottomAds([])
    }

    if (headerResult.status === 'fulfilled') {
      setMobileHeaderAds(Array.isArray(headerResult.value) ? headerResult.value : [])
    } else {
      setMobileHeaderAds([])
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
    let record = ad
    const adId = ad.advertisementId ?? ad.id

    if (adId != null) {
      try {
        const detail = await advertisementsService.getAdvertisementById(adId)
        if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
          record = detail
        }
        if (!imageUrls.length) imageUrls = getImageUrlsFromAd(record)
        if (!thumbnailUrls.length) thumbnailUrls = getThumbnailUrlsFromAd(record)
      } catch {
        // keep list-row values
      }
    }

    setSelectedAd({ ...record, imageUrls, thumbnailUrls })

    setFormData({
      title: record.title || '',
      description: record.description || '',
      productCategoryId: pickProductCategoryId(record),
      platform: record.platform || 'mobile',
      position: record.position || 'banner',
      isSlider: !!record.isSlider,
      displayOrder: Number(record.displayOrder ?? 1),
      clickAction: record.clickAction || 'url',
      clickUrl: record.clickUrl || '',
      clickTargetId: record.clickTargetId ?? '',
      startDate: toDateInputValue(record.startDate),
      endDate: toDateInputValue(record.endDate),
      isActive: record.isActive ?? true,
      imageUrlsText: imageUrls.join('\n'),
      thumbnailUrlsText: thumbnailUrls.join('\n'),
      titleColor: pickAdColor(record, 'titleColor', 'TitleColor', DEFAULT_TITLE_COLOR),
      subtitleColor: pickAdColor(record, 'subtitleColor', 'SubtitleColor', DEFAULT_SUBTITLE_COLOR),
      ctaBackgroundColor: pickAdColor(
        record,
        'ctaBackgroundColor',
        'CtaBackgroundColor',
        DEFAULT_CTA_BG
      ),
      ctaTextColor: pickAdColor(record, 'ctaTextColor', 'CtaTextColor', DEFAULT_CTA_TEXT),
      buttonLabel: pickAdString(record, 'buttonLabel', 'ButtonLabel', DEFAULT_BUTTON_LABEL),
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

    const optionalTrim = (v) => {
      const t = String(v ?? '').trim()
      return t || null
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
      titleColor: optionalTrim(formData.titleColor),
      subtitleColor: optionalTrim(formData.subtitleColor),
      ctaBackgroundColor: optionalTrim(formData.ctaBackgroundColor),
      ctaTextColor: optionalTrim(formData.ctaTextColor),
      buttonLabel: optionalTrim(formData.buttonLabel),
      productCategoryId:
        formData.productCategoryId === '' || formData.productCategoryId == null
          ? null
          : Number(formData.productCategoryId),
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

        if (filters.productCategoryId === 'global') {
          const cid = ad.productCategoryId ?? ad.ProductCategoryId
          if (cid != null && cid !== '') return false
        } else if (filters.productCategoryId !== 'all') {
          const cid = String(ad.productCategoryId ?? ad.ProductCategoryId ?? '')
          if (cid !== String(filters.productCategoryId)) return false
        }

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
            <FiImage /> {t('ads.title')}
          </h1>
          <p className="page-subtitle">{t('ads.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={fetchAll}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <FiPlus /> {t('ads.addAd')}
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
          <option value="all">{t('common.allStatus')}</option>
          <option value="active">{t('common.active')}</option>
          <option value="inactive">{t('common.inactive')}</option>
        </select>
        <select
          value={filters.productCategoryId}
          onChange={(e) => setFilters((prev) => ({ ...prev, productCategoryId: e.target.value }))}
        >
          <option value="all">{t('ads.allCategories')}</option>
          <option value="global">{t('ads.globalAd')}</option>
          {productCategories.map((c) => {
            const id = c.categoryId ?? c.id
            return (
              <option key={id} value={String(id)}>
                {c.nameAr || c.nameEn || c.name}
              </option>
            )
          })}
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
        <div className="card">{t('ads.loading')}</div>
      ) : (
        <div className="card table-wrapper">
          <table className="ads-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Title</th>
                <th>Platform</th>
                <th>{t('ads.productCategory')}</th>
                <th>Position</th>
                <th>Schedule</th>
                <th>Views</th>
                <th>Clicks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-row">
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
                    <td>{categoryLabel(ad.productCategoryId ?? ad.ProductCategoryId)}</td>
                    <td>{ad.position || '-'}</td>
                    <td>
                      <span>{ad.startDate ? new Date(ad.startDate).toLocaleDateString() : '-'}</span>
                      <span> - </span>
                      <span>{ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'No expiry'}</span>
                    </td>
                    <td className="stats-cell">
                      <strong>{formatAdMetric(ad, 'viewCount', 'ViewCount')}</strong>
                      <span>impressions</span>
                    </td>
                    <td className="stats-cell">
                      <strong>{formatAdMetric(ad, 'clickCount', 'ClickCount')}</strong>
                      <span>taps</span>
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
        <div className="mobile-preview-card__header">
          <h2>{t('ads.mobilePreviewTitle')}</h2>
          <div className="mobile-preview-card__filter">
            <label>{t('ads.previewCategoryFilter')}</label>
            <select
              value={previewCategoryId}
              onChange={(e) => setPreviewCategoryId(e.target.value)}
            >
              <option value="">{t('ads.previewNoCategoryFilter')}</option>
              {productCategories.map((c) => {
                const id = c.categoryId ?? c.id
                return (
                  <option key={id} value={String(id)}>
                    {c.nameAr || c.nameEn || c.name}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
        <p className="spec-note">{t('ads.productCategoryHint')}</p>
        {previewError && <div className="preview-error">{previewError}</div>}

        <h3 className="preview-endpoint-title">{t('ads.previewAppCarousel')}</h3>
        <div className="mobile-preview-grid">
          {mobileAds.length === 0 ? (
            <p>{t('ads.previewEmpty')}</p>
          ) : (
            mobileAds.map((ad) => {
              const preview = toAppPreviewProps(ad)
              const variant = previewVariantFromAd(ad)
              return (
                <div key={preview?.advertisementId ?? ad.advertisementId} className="mobile-ad-card">
                  <AppAdPreviewByVariant variant={variant} {...preview} />
                </div>
              )
            })
          )}
        </div>

        <h3 className="preview-endpoint-title">{t('ads.previewBottom')}</h3>
        <div className="mobile-preview-grid">
          {mobileBottomAds.length === 0 ? (
            <p>{t('ads.previewEmpty')}</p>
          ) : (
            mobileBottomAds.map((ad) => {
              const preview = toAppPreviewProps(ad)
              return (
                <div key={`bottom-${preview?.advertisementId ?? ad.advertisementId}`} className="mobile-ad-card">
                  <AppAdPreviewByVariant variant="bottom" {...preview} />
                </div>
              )
            })
          )}
        </div>

        <h3 className="preview-endpoint-title">{t('ads.previewHeader')}</h3>
        <div className="mobile-preview-grid">
          {mobileHeaderAds.length === 0 ? (
            <p>{t('ads.previewEmpty')}</p>
          ) : (
            mobileHeaderAds.map((ad) => {
              const preview = toAppPreviewProps(ad)
              return (
                <div key={`header-${preview?.advertisementId ?? ad.advertisementId}`} className="mobile-ad-card">
                  <AppAdPreviewByVariant variant="banner" {...preview} />
                </div>
              )
            })
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="ad-modal-layout" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content ad-modal-content">
              <div className="modal-header">
                <h2>{selectedAd ? 'Edit Ad' : 'Create Ad'}</h2>
                <button type="button" className="modal-close" onClick={closeModal}>
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
                  <label>{t('ads.productCategory')}</label>
                  <select
                    value={formData.productCategoryId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, productCategoryId: e.target.value }))
                    }
                  >
                    <option value="">{t('ads.globalAd')}</option>
                    {productCategories.map((c) => {
                      const id = c.categoryId ?? c.id
                      return (
                        <option key={id} value={String(id)}>
                          {c.nameAr || c.nameEn || c.name}
                        </option>
                      )
                    })}
                  </select>
                  <small className="spec-note">{t('ads.productCategoryHint')}</small>
                </div>
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

              <h3>Appearance (in-app card)</h3>
              <p className="spec-note">
                Colors and button label match the public app payload (e.g.{' '}
                <code>titleColor</code>, <code>ctaBackgroundColor</code>).
              </p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Title color</label>
                  <div className="color-row">
                    <input
                      type="color"
                      aria-label="Title color"
                      value={hexForColorInput(formData.titleColor)}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, titleColor: e.target.value }))
                      }
                    />
                    <input
                      type="text"
                      value={formData.titleColor}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, titleColor: e.target.value }))
                      }
                      placeholder="#4ade80"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Subtitle / description color</label>
                  <div className="color-row">
                    <input
                      type="color"
                      aria-label="Subtitle color"
                      value={hexForColorInput(formData.subtitleColor)}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, subtitleColor: e.target.value }))
                      }
                    />
                    <input
                      type="text"
                      value={formData.subtitleColor}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, subtitleColor: e.target.value }))
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>CTA background</label>
                  <div className="color-row">
                    <input
                      type="color"
                      aria-label="CTA background"
                      value={hexForColorInput(formData.ctaBackgroundColor)}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ctaBackgroundColor: e.target.value }))
                      }
                    />
                    <input
                      type="text"
                      value={formData.ctaBackgroundColor}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ctaBackgroundColor: e.target.value }))
                      }
                      placeholder="#047857"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>CTA text</label>
                  <div className="color-row">
                    <input
                      type="color"
                      aria-label="CTA text color"
                      value={hexForColorInput(formData.ctaTextColor)}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ctaTextColor: e.target.value }))
                      }
                    />
                    <input
                      type="text"
                      value={formData.ctaTextColor}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ctaTextColor: e.target.value }))
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Button label</label>
                  <input
                    type="text"
                    value={formData.buttonLabel}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, buttonLabel: e.target.value }))
                    }
                    placeholder={DEFAULT_BUTTON_LABEL}
                  />
                </div>
              </div>

              <h3>Media</h3>
              {selectedAd && (
                <p className="spec-note edit-media-hint">
                  Existing images stay on the ad until you upload new files or change the URL list
                  below.
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, imageUrlsText: e.target.value }))
                  }
                  placeholder="https://cdn.example.com/ad-main.jpg"
                />
                <small className="spec-note">
                  Banner height in app: 96px (h-24). Required: 4:1 ratio, minimum 800×200. Bottom
                  strip tile: 260×76.
                </small>
              </div>
              <div className="form-group">
                <label>Thumbnail URLs (one URL per line)</label>
                <textarea
                  rows={3}
                  value={formData.thumbnailUrlsText}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, thumbnailUrlsText: e.target.value }))
                  }
                  placeholder="https://cdn.example.com/ad-thumb.jpg"
                />
                <small className="spec-note">
                  File size policy: target 300KB max, hard limit 500KB (must be enforced by your
                  uploader/backend).
                </small>
              </div>

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

            <aside className="ad-modal-floating-preview" aria-label="App preview">
              <div className="ad-modal-floating-preview__inner">
                <p className="floating-preview-title">معاينة التطبيق</p>
                <div className="preview-variant-toggle" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={modalPreviewVariant === 'banner'}
                    className={`preview-variant-toggle__btn ${modalPreviewVariant === 'banner' ? 'is-active' : ''}`}
                    onClick={() => setModalPreviewVariant('banner')}
                  >
                    سلايدر علوي
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={modalPreviewVariant === 'bottom'}
                    className={`preview-variant-toggle__btn ${modalPreviewVariant === 'bottom' ? 'is-active' : ''}`}
                    onClick={() => setModalPreviewVariant('bottom')}
                  >
                    شريط سفلي
                  </button>
                </div>
                <AppAdPreviewByVariant
                  variant={modalPreviewVariant}
                  {...modalLivePreview}
                  placeholder="أضف رابط صورة أو ارفع ملفًا"
                />
                <p className="spec-note floating-preview-hint">
                  العلوي: h-24، هوامش mx-4، overlay 30%. السفلي: 260×76، overlay 35%، بدون زر.
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ads
