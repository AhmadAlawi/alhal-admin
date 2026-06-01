import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FiLoader, FiMapPin, FiRefreshCw } from 'react-icons/fi'
import SyriaMap from '../components/SyriaMap/SyriaMap'
import governoratesService from '../services/governoratesService'
import productsService from '../services/productsService'
import { useSyriaMapData } from '../hooks/useSyriaMapData'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../contexts/LocaleContext'
import { MARKER_ZOOM_THRESHOLD } from '../utils/govMapsUtils'
import '../components/SyriaMap/SyriaMap.css'

const SyriaProductsMap = () => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const [governorates, setGovernorates] = useState([])
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({
    governorateId: '',
    productId: '',
    topProductsPerGovernorate: 10,
  })

  const stableFilters = useMemo(
    () => ({
      governorateId: filters.governorateId || null,
      productId: filters.productId || null,
      topProductsPerGovernorate: filters.topProductsPerGovernorate,
    }),
    [filters.governorateId, filters.productId, filters.topProductsPerGovernorate]
  )

  const { data, loading, error, setZoom, includeMarkers, reload } = useSyriaMapData(
    'products',
    stableFilters
  )

  useEffect(() => {
    governoratesService.getOptions(language).then(setGovernorates).catch(() => {})
    productsService
      .list()
      .then((list) => setProducts(Array.isArray(list) ? list : []))
      .catch(() => setProducts([]))
  }, [language])

  const governorateProducts = data?.governorateProducts || []

  const label = useCallback(
    (ar, en) => (language === 'ar' ? ar || en : en || ar),
    [language]
  )

  const productLabel = (p) =>
    language === 'ar' ? p.nameAr || p.nameEn : p.nameEn || p.nameAr

  return (
    <div className="gov-entity-analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('syriaMaps.productsTitle')}</h1>
          <p className="page-subtitle">{t('syriaMaps.productsSubtitle')}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={reload} disabled={loading}>
          <FiRefreshCw className={loading ? 'spin' : ''} /> {t('common.refresh')}
        </button>
      </div>

      <div className="map-filters card" style={{ padding: '1rem' }}>
        <div className="filter-group">
          <label>{t('dashboard.governorate')}</label>
          <select
            className="filter-select"
            value={filters.governorateId}
            onChange={(e) => setFilters((prev) => ({ ...prev, governorateId: e.target.value }))}
          >
            <option value="">{t('common.all')}</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>{t('syriaMaps.product')}</label>
          <select
            className="filter-select"
            value={filters.productId}
            onChange={(e) => setFilters((prev) => ({ ...prev, productId: e.target.value }))}
          >
            <option value="">{t('common.all')}</option>
            {products.map((p) => {
              const id = p.productId ?? p.id
              return (
                <option key={id} value={id}>
                  {productLabel(p)}
                </option>
              )
            })}
          </select>
        </div>
        <div className="filter-group">
          <label>{t('syriaMaps.topProducts')}</label>
          <select
            className="filter-select"
            value={filters.topProductsPerGovernorate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                topProductsPerGovernorate: Number(e.target.value),
              }))
            }
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="map-zoom-hint">
        <FiMapPin />{' '}
        {includeMarkers
          ? t('syriaMaps.markersVisible')
          : t('syriaMaps.zoomForMarkers', { zoom: MARKER_ZOOM_THRESHOLD })}
      </p>

      {error && (
        <div className="report-error card">
          <p>{error}</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={reload}>
            {t('reports.retry')}
          </button>
        </div>
      )}

      <div className="syria-map-page-layout">
        <div className="card" style={{ padding: '0.75rem' }}>
          {loading && !data ? (
            <div className="syria-map-loading">
              <FiLoader className="spin" /> {t('common.loading')}
            </div>
          ) : (
            <SyriaMap
              data={data}
              mapKind="products"
              height={560}
              language={language}
              onZoomChange={setZoom}
            />
          )}
        </div>

        <aside className="syria-map-sidebar card">
          <h3>{t('syriaMaps.productsByGovernorate')}</h3>
          {!governorateProducts.length && !loading && (
            <p className="gov-product-meta">{t('common.noData')}</p>
          )}
          {governorateProducts.map((gov) => (
            <div key={gov.governorateId} className="gov-product-row">
              <strong>{label(gov.nameAr, gov.nameEn)}</strong>
              <div className="gov-product-meta">
                {t('syriaMaps.totalOffered')}: {gov.totalOfferedQuantityKg?.toLocaleString()} kg
              </div>
              <div className="product-chip-list">
                {(gov.products || []).map((p) => (
                  <span key={p.productId} className="product-chip">
                    {label(p.productNameAr, p.productNameEn)} ({p.offeredQuantityKg} kg)
                  </span>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

export default SyriaProductsMap
