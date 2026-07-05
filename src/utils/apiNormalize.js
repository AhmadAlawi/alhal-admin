/**
 * Coerce API numeric fields; status breakdown objects sum to a total count.
 */
export function toPositiveNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n) && n >= 0) return n
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sum = Object.values(value).reduce((acc, v) => {
      const n = Number(v)
      return acc + (Number.isFinite(n) ? n : 0)
    }, 0)
    if (sum >= 0) return sum
  }
  return fallback
}

export function isStatusBreakdown(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  const keys = Object.keys(obj)
  const statusKeys = ['open', 'pending', 'negotiating', 'completed', 'cancelled']
  return keys.length > 0 && keys.every((k) => statusKeys.includes(k) || typeof obj[k] === 'number')
}

/**
 * Parse paginated list responses (ApiResponse wrapper or legacy shapes).
 */
function extractListArray(root, response) {
  if (Array.isArray(root)) return root
  if (!root || typeof root !== 'object') {
    if (Array.isArray(response?.items)) return response.items
    return []
  }
  if (Array.isArray(root.items)) return root.items
  if (Array.isArray(root.requests)) return root.requests
  if (Array.isArray(root.results)) return root.results
  if (Array.isArray(response?.items)) return response.items
  return []
}

export function normalizeTransportRequest(row) {
  if (!row || typeof row !== 'object' || isStatusBreakdown(row)) return null
  const id = row.transportRequestId ?? row.requestId ?? row.id
  if (id == null) return null

  let status = row.status
  if (status != null && typeof status === 'object') {
    status = status.name ?? status.value ?? status.code ?? ''
  }

  return {
    ...row,
    transportRequestId: id,
    status: typeof status === 'string' ? status : String(status || ''),
  }
}

export function parsePaginatedList(response) {
  let items = []
  let total = 0
  let totalPages = 1
  let statusCounts = null

  const root = response?.data?.data ?? response?.data ?? response

  if (!root) {
    return { items, total, totalPages, statusCounts }
  }

  // Entire payload is status breakdown only (no list)
  if (isStatusBreakdown(root) && !Array.isArray(root.items)) {
    statusCounts = { ...root }
    total = toPositiveNumber(root)
    return { items: [], total, totalPages: 1, statusCounts }
  }

  items = extractListArray(root, response)
    .map(normalizeTransportRequest)
    .filter(Boolean)

  statusCounts =
    root.statusCounts ||
    root.statusSummary ||
    (isStatusBreakdown(root.total) ? root.total : null) ||
    (isStatusBreakdown(root.counts) ? root.counts : null) ||
    (isStatusBreakdown(root) ? root : null)

  const rawTotal = root.total ?? root.totalCount ?? response?.total ?? response?.totalCount
  if (isStatusBreakdown(rawTotal)) {
    statusCounts = statusCounts || rawTotal
    total = toPositiveNumber(rawTotal, items.length)
  } else {
    total = toPositiveNumber(rawTotal, items.length)
  }

  const rawPages = root.totalPages ?? response?.totalPages
  const pageCount = isStatusBreakdown(rawPages)
    ? Math.max(1, Math.ceil(total / 20) || 1)
    : toPositiveNumber(rawPages, Math.max(1, Math.ceil(total / 20) || 1))
  totalPages = Math.max(1, pageCount)

  return { items, total, totalPages, statusCounts }
}

export function formatCellValue(value) {
  if (value == null) return 'N/A'
  if (typeof value === 'object') return 'N/A'
  return String(value)
}

/** Unwrap ApiResponse { success, data } or legacy shapes into a list array. */
export function unwrapApiList(response, arrayKeys = ['products', 'items', 'categories', 'subCategories', 'data']) {
  if (Array.isArray(response)) return response

  if (response?.success === false) {
    const msg =
      response.message ||
      response.error?.detail ||
      response.error?.message ||
      'فشل تحميل البيانات'
    throw new Error(msg)
  }

  let data = response?.data?.data ?? response?.data ?? response

  if (Array.isArray(data)) return data

  if (data && typeof data === 'object') {
    for (const key of arrayKeys) {
      if (Array.isArray(data[key])) return data[key]
    }
  }

  return []
}

export function unwrapApiData(response) {
  if (response == null) return null
  if (response.success === false) {
    throw new Error(response.message || response.error?.detail || 'فشل الطلب')
  }
  if (response.success === true && response.data !== undefined) {
    return response.data?.data ?? response.data
  }
  return response.data ?? response
}

export function getEntityId(entity, ...keys) {
  if (!entity) return null
  for (const key of keys) {
    if (entity[key] != null) return entity[key]
  }
  return null
}

export function getProductId(product) {
  return getEntityId(product, 'productId', 'id', 'ProductId')
}

/** API category/subcategory rows may come back PascalCase — normalize to camelCase used across the UI. */
export function normalizeCategory(c) {
  if (!c || typeof c !== 'object') return c
  return {
    ...c,
    categoryId: c.categoryId ?? c.CategoryId,
    subCategoryId: c.subCategoryId ?? c.SubCategoryId,
    nameAr: c.nameAr ?? c.NameAr,
    nameEn: c.nameEn ?? c.NameEn,
    isActive: c.isActive ?? c.IsActive,
  }
}

/** API product rows may come back PascalCase — normalize to camelCase used across the UI. */
export function normalizeProduct(p) {
  if (!p || typeof p !== 'object') return p
  return {
    ...p,
    productId: p.productId ?? p.ProductId,
    nameAr: p.nameAr ?? p.NameAr,
    nameEn: p.nameEn ?? p.NameEn,
    category: p.category ?? p.Category,
    categoryId: p.categoryId ?? p.CategoryId,
    subCategoryId: p.subCategoryId ?? p.SubCategoryId,
    imageUrl: p.imageUrl ?? p.ImageUrl,
    cardColor: p.cardColor ?? p.CardColor,
    description: p.description ?? p.Description,
    isActive: p.isActive ?? p.IsActive,
    createdAt: p.createdAt ?? p.CreatedAt,
    updatedAt: p.updatedAt ?? p.UpdatedAt,
    productCategory: p.productCategory ?? p.ProductCategory,
    productSubCategory: p.productSubCategory ?? p.ProductSubCategory,
    governmentPrices: p.governmentPrices ?? p.GovernmentPrices,
  }
}

export function extractImageUrl(uploadResponse) {
  const candidates = [
    uploadResponse?.data?.data?.url,
    uploadResponse?.data?.url,
    uploadResponse?.data?.imageUrl,
    uploadResponse?.url,
    typeof uploadResponse?.data === 'string' ? uploadResponse.data : null,
    typeof uploadResponse?.data?.data === 'string' ? uploadResponse.data.data : null,
  ]
  for (const url of candidates) {
    if (typeof url === 'string' && url.trim().length > 0) return url.trim()
  }
  return null
}

export function buildProductPayload(form, { isEdit = false, isActive = true } = {}) {
  const categoryId = Number(form.categoryId)
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    throw new Error('يرجى اختيار الفئة')
  }

  const imageUrl = (form.imageUrl || '').trim()
  if (!imageUrl) {
    throw new Error('يرجى رفع صورة أو إدخال رابط الصورة')
  }

  const payload = {
    nameAr: (form.nameAr || '').trim(),
    nameEn: (form.nameEn || '').trim(),
    categoryId,
    imageUrl,
  }

  const subId = Number(form.subCategoryId)
  if (Number.isFinite(subId) && subId > 0) {
    payload.subCategoryId = subId
  }

  const desc = (form.description || '').trim()
  if (desc) payload.description = desc

  const color = (form.cardColor || '').trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    payload.cardColor = color
  }

  if (isEdit) {
    payload.isActive = isActive !== false
  }

  return payload
}
