import React, { useEffect, useState } from 'react'
import adminService from '../../services/adminService'
import areasService from '../../services/areasService'
import governoratesService from '../../services/governoratesService'
import { reportSupportsFilter } from '../../utils/govAnalyticsFilterConfig'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../contexts/LocaleContext'

const PERIOD_OPTIONS = [
  { value: 0, labelKey: 'dashboard.allTimes' },
  { value: 7, labelKey: 'govAnalytics.last7Days' },
  { value: 30, labelKey: 'govAnalytics.last30Days' },
  { value: 90, labelKey: 'govAnalytics.last90Days' },
  { value: 365, labelKey: 'govAnalytics.lastYear' },
]

const USER_ROLES = [
  { value: '', labelKey: 'common.all' },
  { value: 'farmer', labelKey: 'govAnalytics.roles.farmer' },
  { value: 'trader', labelKey: 'govAnalytics.roles.trader' },
  { value: 'transporter', labelKey: 'govAnalytics.roles.transporter' },
]

const SALE_TYPES = [
  { value: '', labelKey: 'common.all' },
  { value: 'auction', labelKey: 'govAnalytics.saleTypes.auction' },
  { value: 'tender', labelKey: 'govAnalytics.saleTypes.tender' },
  { value: 'direct', labelKey: 'govAnalytics.saleTypes.direct' },
]

const GovAnalyticsFilterBar = ({
  catalogItem,
  reportId,
  entityId,
  filters,
  onChange,
  governorateOptions,
}) => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [areaOptions, setAreaOptions] = useState([])

  const supports = (key) => reportSupportsFilter(catalogItem, key, reportId)

  const governorateFilterRequired =
    entityId === 'governorate' &&
    (reportId?.includes('summary') || supports('governorateId'))

  const showGovernorate =
    governorateFilterRequired ||
    (entityId !== 'governorate' && supports('governorateId'))

  const showFromGov = supports('fromGovernorateId')
  const showToGov = supports('toGovernorateId')
  const showArea = supports('areaId')
  const showCategory = supports('categoryId')
  const showProduct = supports('productId')
  const showGranularity =
    supports('granularity') ||
    catalogItem?.visualizationType === 'line' ||
    reportId?.includes('price-over-time')
  const showUserRole = supports('userRole')
  const showSaleType = supports('saleType')

  useEffect(() => {
    if (!showCategory && !showProduct) return undefined
    let cancelled = false
    Promise.all([
      adminService.getCategories({ isActive: true }).catch(() => ({ data: [] })),
      adminService.getProducts().catch(() => ({ data: [] })),
    ]).then(([catRes, prodRes]) => {
      if (cancelled) return
      setCategories(Array.isArray(catRes.data) ? catRes.data : [])
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : [])
    })
    return () => {
      cancelled = true
    }
  }, [showCategory, showProduct, language])

  useEffect(() => {
    if (!showArea) {
      setAreaOptions([])
      return undefined
    }
    const govId = filters.governorateId
    if (!govId) {
      setAreaOptions([])
      return undefined
    }
    let cancelled = false
    areasService
      .getAreas({ governorateId: govId, language })
      .then((list) => {
        if (!cancelled) setAreaOptions(list)
      })
      .catch(() => {
        if (!cancelled) setAreaOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [showArea, filters.governorateId, language])

  const set = (patch) => onChange((prev) => ({ ...prev, ...patch }))

  const categoryLabel = (c) =>
    language === 'ar' ? c.nameAr || c.nameEn || c.name : c.nameEn || c.nameAr || c.name

  const productLabel = (p) =>
    language === 'ar' ? p.nameAr || p.nameEn || p.name : p.nameEn || p.nameAr || p.name

  return (
    <div className="report-filters">
      <div className="filter-group">
        <label>{t('govAnalytics.period')}</label>
        <select
          className="filter-select"
          value={filters.days}
          onChange={(e) => set({ days: Number(e.target.value) })}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {governorateFilterRequired && (
        <div className="filter-group">
          <label>{t('dashboard.governorate')} *</label>
          <select
            className="filter-select"
            required
            value={filters.governorateId}
            onChange={(e) => set({ governorateId: e.target.value, areaId: '' })}
          >
            <option value="">{t('govAnalytics.selectGovernorate')}</option>
            {governorateOptions.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showGovernorate && !governorateFilterRequired && (
        <div className="filter-group">
          <label>{t('dashboard.governorate')}</label>
          <select
            className="filter-select"
            value={filters.governorateId}
            onChange={(e) => set({ governorateId: e.target.value, areaId: '' })}
          >
            <option value="">{t('common.all')}</option>
            {governorateOptions.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showFromGov && (
        <div className="filter-group">
          <label>{t('govAnalytics.fromGovernorate')}</label>
          <select
            className="filter-select"
            value={filters.fromGovernorateId}
            onChange={(e) => set({ fromGovernorateId: e.target.value })}
          >
            <option value="">{t('common.all')}</option>
            {governorateOptions.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showToGov && (
        <div className="filter-group">
          <label>{t('govAnalytics.toGovernorate')}</label>
          <select
            className="filter-select"
            value={filters.toGovernorateId}
            onChange={(e) => set({ toGovernorateId: e.target.value })}
          >
            <option value="">{t('common.all')}</option>
            {governorateOptions.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showArea && (
        <div className="filter-group">
          <label>{t('govAnalytics.area')}</label>
          <select
            className="filter-select"
            value={filters.areaId}
            disabled={!filters.governorateId}
            onChange={(e) => set({ areaId: e.target.value })}
          >
            <option value="">{t('common.all')}</option>
            {areaOptions.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showCategory && (
        <div className="filter-group">
          <label>{t('govAnalytics.productCategory')}</label>
          <select
            className="filter-select"
            value={filters.categoryId}
            onChange={(e) => set({ categoryId: e.target.value })}
          >
            <option value="">{t('common.all')}</option>
            {categories.map((c) => (
              <option key={c.categoryId ?? c.id} value={String(c.categoryId ?? c.id)}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
      )}

      {showProduct && (
        <div className="filter-group">
          <label>{t('govAnalytics.product')}</label>
          <select
            className="filter-select"
            value={filters.productId}
            onChange={(e) => set({ productId: e.target.value })}
          >
            <option value="">{t('common.all')}</option>
            {products.map((p) => (
              <option key={p.productId ?? p.id} value={String(p.productId ?? p.id)}>
                {productLabel(p)}
              </option>
            ))}
          </select>
        </div>
      )}

      {showUserRole && (
        <div className="filter-group">
          <label>{t('govAnalytics.userRole')}</label>
          <select
            className="filter-select"
            value={filters.userRole}
            onChange={(e) => set({ userRole: e.target.value })}
          >
            {USER_ROLES.map((r) => (
              <option key={r.value || 'all'} value={r.value}>
                {t(r.labelKey)}
              </option>
            ))}
          </select>
        </div>
      )}

      {showSaleType && (
        <div className="filter-group">
          <label>{t('govAnalytics.saleType')}</label>
          <select
            className="filter-select"
            value={filters.saleType}
            onChange={(e) => set({ saleType: e.target.value })}
          >
            {SALE_TYPES.map((s) => (
              <option key={s.value || 'all'} value={s.value}>
                {t(s.labelKey)}
              </option>
            ))}
          </select>
        </div>
      )}

      {showGranularity && (
        <div className="filter-group">
          <label>{t('analytics.groupBy')}</label>
          <select
            className="filter-select"
            value={filters.granularity}
            onChange={(e) => set({ granularity: e.target.value })}
          >
            <option value="day">{t('analytics.daily')}</option>
            <option value="week">{t('analytics.weekly')}</option>
            <option value="month">{t('analytics.monthly')}</option>
          </select>
        </div>
      )}
    </div>
  )
}

export default GovAnalyticsFilterBar
