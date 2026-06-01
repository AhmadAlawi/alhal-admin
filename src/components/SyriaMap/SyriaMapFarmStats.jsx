import React from 'react'
import { formatHectares } from '../../utils/govMapsUtils'

const LABELS = {
  ar: {
    farmers: 'مزارعون',
    farms: 'مزارع',
    totalArea: 'المساحة الإجمالية',
    ha: 'هكتار',
    offered: 'معروض',
    kg: 'كغ',
    totalOffered: 'الكمية المعروضة',
    topProducts: 'أبرز المنتجات',
    governorates: 'محافظات',
    productTypes: 'أصناف',
    farmer: 'الفلاح',
    area: 'المساحة',
    ownership: 'الملكية',
  },
  en: {
    farmers: 'Farmers',
    farms: 'Farms',
    totalArea: 'Total area',
    ha: 'ha',
    offered: 'Offered',
    kg: 'kg',
    totalOffered: 'Total offered',
    topProducts: 'Top products',
    governorates: 'Governorates',
    productTypes: 'Product types',
    farmer: 'Farmer',
    area: 'Area',
    ownership: 'Ownership',
  },
}

export function getMapLabels(language = 'ar') {
  return LABELS[language] || LABELS.ar
}

export function FarmStatsPanel({ totals, language = 'ar' }) {
  const L = getMapLabels(language)
  if (!totals || (totals.farmers === 0 && totals.farms === 0 && totals.area === 0)) {
    return null
  }

  return (
    <div className="syria-map-stats-panel">
      <div className="syria-map-stat">
        <span className="syria-map-stat-value">{totals.farmers.toLocaleString()}</span>
        <span className="syria-map-stat-label">{L.farmers}</span>
      </div>
      <div className="syria-map-stat-divider" />
      <div className="syria-map-stat">
        <span className="syria-map-stat-value">{totals.farms.toLocaleString()}</span>
        <span className="syria-map-stat-label">{L.farms}</span>
      </div>
      <div className="syria-map-stat-divider" />
      <div className="syria-map-stat">
        <span className="syria-map-stat-value">
          {formatHectares(totals.area, language)}
        </span>
        <span className="syria-map-stat-label">
          {L.totalArea} ({L.ha})
        </span>
      </div>
    </div>
  )
}

export function MarkerStatTooltip({ title, farmers, farms, areaHectares, language = 'ar' }) {
  const L = getMapLabels(language)
  return (
    <div className="syria-map-marker-label">
      {title && <strong className="syria-map-marker-title">{title}</strong>}
      <div className="syria-map-marker-stats">
        <span>{L.farmers}: {Number(farmers) || 0}</span>
        <span>{L.farms}: {Number(farms) || 0}</span>
        <span>{formatHectares(areaHectares, language)} {L.ha}</span>
      </div>
    </div>
  )
}

export function FarmPopupContent({ summary, language = 'ar' }) {
  const L = getMapLabels(language)
  if (!summary) return null
  const name =
    language === 'ar'
      ? summary.nameAr || summary.nameEn
      : summary.nameEn || summary.nameAr

  return (
    <div className="syria-map-popup-stats">
      <strong>{name}</strong>
      <ul>
        <li>{L.farmers}: {Number(summary.farmerCount) || 0}</li>
        <li>{L.farms}: {Number(summary.farmCount) || 0}</li>
        <li>
          {L.totalArea}: {formatHectares(summary.totalAreaHectares, language)} {L.ha}
        </li>
        {summary.offeredCropQuantityKg != null && (
          <li>
            {L.offered}: {Number(summary.offeredCropQuantityKg).toLocaleString()} {L.kg}
          </li>
        )}
      </ul>
    </div>
  )
}

export function FarmMarkerPopup({ farm, language = 'ar' }) {
  const L = getMapLabels(language)
  return (
    <div className="syria-map-popup-stats">
      <strong>{farm.farmName}</strong>
      <ul>
        <li>{L.farmer}: {farm.farmerName}</li>
        <li>
          {L.area}: {formatHectares(farm.areaHectares, language)} {L.ha}
        </li>
        {farm.landOwnershipType && (
          <li>
            {L.ownership}: {farm.landOwnershipType}
          </li>
        )}
      </ul>
    </div>
  )
}

export function ProductStatsPanel({ totals, language = 'ar' }) {
  const L = getMapLabels(language)
  if (!totals || totals.governorates === 0) return null

  return (
    <div className="syria-map-stats-panel products">
      <div className="syria-map-stat">
        <span className="syria-map-stat-value">{totals.governorates}</span>
        <span className="syria-map-stat-label">{L.governorates}</span>
      </div>
      <div className="syria-map-stat-divider" />
      <div className="syria-map-stat">
        <span className="syria-map-stat-value">
          {totals.totalKg.toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}
        </span>
        <span className="syria-map-stat-label">
          {L.totalOffered} ({L.kg})
        </span>
      </div>
    </div>
  )
}

export function ProductGovernorateTooltip({ gov, language = 'ar' }) {
  const L = getMapLabels(language)
  const name =
    language === 'ar' ? gov.nameAr || gov.nameEn : gov.nameEn || gov.nameAr
  const qty = Number(gov.totalOfferedQuantityKg) || 0
  const products = gov.products || []

  return (
    <div className="syria-map-marker-label products">
      {name && <strong className="syria-map-marker-title">{name}</strong>}
      <div className="syria-map-marker-stats">
        <span>
          {L.totalOffered}: {qty.toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')} {L.kg}
        </span>
      </div>
      {products.length > 0 && (
        <ul className="syria-map-marker-products">
          {products.slice(0, 4).map((p) => (
            <li key={p.productId}>
              {language === 'ar'
                ? p.productNameAr || p.productNameEn
                : p.productNameEn || p.productNameAr}
              : {Number(p.offeredQuantityKg || 0).toLocaleString()} {L.kg}
            </li>
          ))}
          {products.length > 4 && <li>+{products.length - 4}</li>}
        </ul>
      )}
    </div>
  )
}

export function CropMarkerTooltip({ crop, language = 'ar' }) {
  const L = getMapLabels(language)
  const name =
    language === 'ar'
      ? crop.productNameAr || crop.productNameEn
      : crop.productNameEn || crop.productNameAr

  return (
    <div className="syria-map-marker-label crop">
      <strong className="syria-map-marker-title">{name}</strong>
      <div className="syria-map-marker-stats">
        <span>
          {Number(crop.quantityKg || 0).toLocaleString()} {L.kg}
        </span>
      </div>
    </div>
  )
}
