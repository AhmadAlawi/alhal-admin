/** Clean API location names (e.g. "الحسكة\r\nالحسكة" → "الحسكة") */
export function cleanLocationName(value) {
  if (value == null) return ''
  return String(value)
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function pickLocalizedName(item, language = 'ar') {
  const nameAr = cleanLocationName(item?.nameAr ?? item?.name)
  const nameEn = cleanLocationName(item?.nameEn ?? nameAr)
  return language === 'ar' ? nameAr || nameEn : nameEn || nameAr
}

/** Unwrap `{ success, data: [] }` and legacy shapes */
export function unwrapLocationList(response) {
  if (!response) return []
  if (Array.isArray(response)) return response
  if (response.success === true && Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data)) return response.data
  const nested = response?.data?.data ?? response.data
  if (Array.isArray(nested)) return nested
  if (Array.isArray(response?.governorates)) return response.governorates
  if (Array.isArray(response?.cities)) return response.cities
  if (Array.isArray(response?.areas)) return response.areas
  if (Array.isArray(response?.items)) return response.items
  return []
}

export function normalizeGovernorate(raw, language = 'ar') {
  if (!raw || typeof raw !== 'object') return null
  const id = raw.governorateId ?? raw.id ?? raw.GovernorateId
  if (id == null) return null
  const nameAr = cleanLocationName(raw.nameAr ?? raw.NameAr ?? raw.name ?? raw.governorate ?? raw.label)
  const nameEn = cleanLocationName(raw.nameEn ?? raw.NameEn ?? nameAr)
  const name = language === 'ar' ? nameAr || nameEn : nameEn || nameAr
  if (!name) return null
  return {
    id,
    governorateId: id,
    name,
    nameAr,
    nameEn,
    isActive: (raw.isActive ?? raw.IsActive) !== false,
    citiesCount: raw.citiesCount ?? raw.CitiesCount,
  }
}

export function normalizeCity(raw, language = 'ar') {
  if (!raw || typeof raw !== 'object') return null
  const cityId = raw.cityId ?? raw.id ?? raw.CityId
  if (cityId == null) return null
  const governorateId = raw.governorateId ?? raw.GovernorateId ?? raw.governorateID
  const nameAr = cleanLocationName(raw.nameAr ?? raw.NameAr ?? raw.name ?? raw.cityName)
  const nameEn = cleanLocationName(raw.nameEn ?? raw.NameEn ?? nameAr)
  const name = language === 'ar' ? nameAr || nameEn : nameEn || nameAr
  return {
    cityId,
    name: name || `#${cityId}`,
    nameAr,
    nameEn,
    governorateId: governorateId != null ? governorateId : undefined,
    governorateNameAr: cleanLocationName(raw.governorateNameAr ?? raw.GovernorateNameAr),
    governorateNameEn: cleanLocationName(raw.governorateNameEn ?? raw.GovernorateNameEn),
    isActive: (raw.isActive ?? raw.IsActive) !== false,
    areasCount: raw.areasCount ?? raw.AreasCount,
  }
}

export function normalizeArea(raw, language = 'ar') {
  if (!raw || typeof raw !== 'object') return null
  const areaId = raw.areaId ?? raw.id ?? raw.AreaId
  if (areaId == null) return null
  const cityId = raw.cityId ?? raw.CityId
  const governorateId = raw.governorateId ?? raw.GovernorateId
  const nameAr = cleanLocationName(raw.nameAr ?? raw.NameAr ?? raw.name)
  const nameEn = cleanLocationName(raw.nameEn ?? raw.NameEn ?? nameAr)
  const name = language === 'ar' ? nameAr || nameEn : nameEn || nameAr
  return {
    areaId,
    name: name || `#${areaId}`,
    nameAr,
    nameEn,
    cityId,
    cityNameAr: cleanLocationName(raw.cityNameAr ?? raw.CityNameAr),
    cityNameEn: cleanLocationName(raw.cityNameEn ?? raw.CityNameEn),
    governorateId,
    governorateNameAr: cleanLocationName(raw.governorateNameAr ?? raw.GovernorateNameAr),
    governorateNameEn: cleanLocationName(raw.governorateNameEn ?? raw.GovernorateNameEn),
    isActive: (raw.isActive ?? raw.IsActive) !== false,
  }
}

export function sortByLocalizedName(items, language = 'ar') {
  const locale = language === 'ar' ? 'ar' : 'en'
  return [...items].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', locale, { sensitivity: 'base' })
  )
}
