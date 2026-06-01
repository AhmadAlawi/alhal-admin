/** Approximate Syria bounding box (WGS84) */
export const SYRIA_BOUNDS = {
  minLatitude: 32.31,
  maxLatitude: 37.29,
  minLongitude: 35.71,
  maxLongitude: 42.39,
}

/** Default view — zoom 7 keeps Syria in frame without neighbors */
export const SYRIA_DEFAULT_CENTER = { lat: 34.8, lng: 38.5, zoom: 7 }

export const SYRIA_MAP_MIN_ZOOM = 7
export const SYRIA_MAP_MAX_ZOOM = 16

/** Fetch farm/crop markers only when zoomed in */
export const MARKER_ZOOM_THRESHOLD = 9

export function unwrapMapPayload(response) {
  return response?.data?.data ?? response?.data ?? response ?? {}
}

export function cleanMapParams(params = {}) {
  const out = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') out[key] = value
  })
  return out
}

export function buildMapQuery(filters = {}, { includeMarkers = true } = {}) {
  return cleanMapParams({
    governorateId: filters.governorateId,
    cityId: filters.cityId,
    productId: filters.productId,
    includeMarkers,
    topProductsPerGovernorate: filters.topProductsPerGovernorate ?? 10,
  })
}

export function getBoundsLatLng(bounds) {
  if (!bounds || bounds.minLatitude == null) return null
  return [
    [bounds.minLatitude, bounds.minLongitude],
    [bounds.maxLatitude, bounds.maxLongitude],
  ]
}

export function getSyriaBoundsLatLng() {
  return getBoundsLatLng(SYRIA_BOUNDS)
}

/** Polygon rings: outer world + inner Syria hole — dims neighboring countries */
export function getSyriaMaskPolygon() {
  const { minLatitude, maxLatitude, minLongitude, maxLongitude } = SYRIA_BOUNDS
  return [
    [
      [90, -180],
      [90, 180],
      [-90, 180],
      [-90, -180],
    ],
    [
      [minLatitude, minLongitude],
      [minLatitude, maxLongitude],
      [maxLatitude, maxLongitude],
      [maxLatitude, minLongitude],
    ],
  ]
}

export function getSyriaBorderPolygon() {
  const { minLatitude, maxLatitude, minLongitude, maxLongitude } = SYRIA_BOUNDS
  return [
    [minLatitude, minLongitude],
    [minLatitude, maxLongitude],
    [maxLatitude, maxLongitude],
    [maxLatitude, minLongitude],
  ]
}

export function quantityColor(intensity, max) {
  if (!max || max <= 0) return '#86efac'
  const t = Math.min(1, Math.max(0, intensity / max))
  const r = Math.round(254 - t * 180)
  const g = Math.round(240 - t * 80)
  const b = Math.round(138 - t * 100)
  return `rgb(${r},${g},${b})`
}

export function circleRadius(count, min = 8, max = 28) {
  const n = Number(count) || 0
  if (n <= 0) return min
  return Math.min(max, min + Math.sqrt(n) * 3)
}

export function computeFarmMapTotals(data) {
  const governorateSummaries = data?.governorateSummaries || []
  const citySummaries = data?.citySummaries || []
  const items = governorateSummaries.length ? governorateSummaries : citySummaries

  return items.reduce(
    (acc, item) => ({
      farmers: acc.farmers + (Number(item.farmerCount) || 0),
      farms: acc.farms + (Number(item.farmCount) || 0),
      area: acc.area + (Number(item.totalAreaHectares) || 0),
    }),
    { farmers: 0, farms: 0, area: 0 }
  )
}

export function sameLocationId(a, b) {
  if (a == null || b == null) return false
  return String(a) === String(b)
}

/** Approximate centroids when no hal center / crop points exist */
export const GOVERNORATE_CENTROIDS = {
  1: [36.5, 40.75],
  2: [36.2, 37.15],
  3: [35.95, 39.01],
  4: [32.71, 36.57],
  5: [33.51, 36.29],
  6: [32.62, 36.1],
  7: [35.33, 40.14],
  8: [35.13, 36.75],
  9: [34.73, 36.72],
  10: [35.93, 36.63],
  11: [35.52, 36.01],
  12: [33.12, 35.82],
  13: [33.45, 36.65],
  14: [34.89, 35.89],
}

export function computeProductMapTotals(data) {
  const items = data?.governorateProducts || []
  return items.reduce(
    (acc, gov) => ({
      totalKg: acc.totalKg + (Number(gov.totalOfferedQuantityKg) || 0),
      productLines: acc.productLines + (gov.products?.length || 0),
      governorates: acc.governorates + 1,
    }),
    { totalKg: 0, productLines: 0, governorates: 0 }
  )
}

export function getGovernorateMapPosition(gov, halCenters = [], citySummaries = []) {
  const govId = gov.governorateId ?? gov.id
  const center = halCenters.find((c) => sameLocationId(c.governorateId, govId))
  if (center?.latitude != null && center?.longitude != null) {
    return [center.latitude, center.longitude]
  }

  const cities = citySummaries.filter(
    (c) =>
      sameLocationId(c.governorateId, govId) &&
      c.centroidLatitude != null &&
      c.centroidLongitude != null
  )
  if (cities.length) {
    const lat = cities.reduce((sum, c) => sum + c.centroidLatitude, 0) / cities.length
    const lng = cities.reduce((sum, c) => sum + c.centroidLongitude, 0) / cities.length
    return [lat, lng]
  }

  const fallback = GOVERNORATE_CENTROIDS[govId] ?? GOVERNORATE_CENTROIDS[Number(govId)]
  return fallback || null
}

export function getProductGovernoratePosition(gov, halCenters = [], cropMarkers = []) {
  const govId = gov.governorateId ?? gov.id
  const fromHal = getGovernorateMapPosition(gov, halCenters, [])
  if (fromHal) return fromHal

  const crops = cropMarkers.filter(
    (c) =>
      sameLocationId(c.governorateId, govId) &&
      c.latitude != null &&
      c.longitude != null
  )
  if (crops.length) {
    const lat = crops.reduce((sum, c) => sum + Number(c.latitude), 0) / crops.length
    const lng = crops.reduce((sum, c) => sum + Number(c.longitude), 0) / crops.length
    return [lat, lng]
  }

  return getGovernorateMapPosition(gov, [], [])
}

export function formatHectares(value, locale = 'ar') {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US', {
    maximumFractionDigits: 1,
  })
}
