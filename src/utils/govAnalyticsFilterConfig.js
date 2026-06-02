/** Report IDs that should request more product rows from the API */
const PRODUCT_TOP_N_REPORT_PATTERNS = [
  /most-demanded/i,
  /least-production|lowest-production|low-production/i,
  /low-availability|scarce/i,
  /high-quantity|top-quantity/i,
  /top-production|highest-production/i,
  /most-produced/i,
]

const TRANSPORT_REPORT_PATTERNS = [
  /inter-governorate|cross-governorate/i,
  /inbound|outbound|trip/i,
  /transport/i,
  /movement-within|within-governorate/i,
]

export const PRODUCT_TOP_N_DEFAULT = 70

export function isProductTopNReport(reportId) {
  const id = reportId || ''
  return PRODUCT_TOP_N_REPORT_PATTERNS.some((re) => re.test(id))
}

export function isTransportRelatedReport(reportId) {
  const id = reportId || ''
  return TRANSPORT_REPORT_PATTERNS.some((re) => re.test(id))
}

export function isPriceTimeReport(reportId) {
  const id = (reportId || '').toLowerCase()
  return id.includes('price-over-time') || id.includes('price-over') || id.includes('price-trend')
}

/**
 * Prefer API catalog supportedFilters; fall back to reportId heuristics when missing.
 */
export function reportSupportsFilter(catalogItem, filterKey, reportId) {
  const supported = catalogItem?.supportedFilters
  if (Array.isArray(supported) && supported.length > 0) {
    return supported.includes(filterKey)
  }
  return inferReportFilter(filterKey, reportId)
}

function inferReportFilter(filterKey, reportId) {
  const id = (reportId || '').toLowerCase()
  switch (filterKey) {
    case 'days':
      return true
    case 'granularity':
      return isPriceTimeReport(reportId) || id.includes('trend') || id.includes('over-time')
    case 'governorateId':
      return !isTransportRelatedReport(reportId) || id.includes('within') || id.includes('quality') || id.includes('active')
    case 'fromGovernorateId':
    case 'toGovernorateId':
      return isTransportRelatedReport(reportId) || id.includes('quantity') && id.includes('governorate')
    case 'areaId':
      return id.includes('within') || id.includes('area') || id.includes('movement') || id.includes('zone')
    case 'categoryId':
    case 'productId':
      return (
        id.includes('product') ||
        id.includes('price') ||
        id.includes('supply') ||
        id.includes('demand') ||
        id.includes('quality') ||
        id.includes('offer') ||
        id.includes('revenue') ||
        id.includes('sale') ||
        id.includes('market') ||
        id.includes('packaging') ||
        id.includes('production')
      )
    case 'userRole':
      return id.includes('user') || id.includes('active') || id.includes('complaint') || id.includes('activity')
    case 'saleType':
      return id.includes('deal') || id.includes('sale') || id.includes('transaction') || id.includes('quantity') && id.includes('successful')
    case 'transportLineId':
      return id.includes('transport') || id.includes('trip') || id.includes('shipping') || id.includes('freight')
    default:
      return false
  }
}

export const REPORT_TITLE_OVERRIDE_AR = {
  'products-by-farming-type': 'توزيع المنتجات حسب نطاق التوريد',
  'distribution-by-farming-type': 'توزيع المنتجات حسب نطاق التوريد',
  'products-by-supply-scope': 'توزيع المنتجات حسب نطاق التوريد',
}

export function resolveReportTitle(catalogItem, reportData, language) {
  const reportId = catalogItem?.reportId || reportData?.reportId
  if (language === 'ar' && reportId && REPORT_TITLE_OVERRIDE_AR[reportId]) {
    return REPORT_TITLE_OVERRIDE_AR[reportId]
  }
  if (catalogItem) {
    return language === 'ar'
      ? catalogItem.titleAr || catalogItem.titleEn
      : catalogItem.titleEn || catalogItem.titleAr
  }
  if (reportData) {
    return language === 'ar'
      ? reportData.titleAr || reportData.titleEn
      : reportData.titleEn || reportData.titleAr
  }
  return ''
}
