import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FiLoader, FiMapPin, FiRefreshCw } from 'react-icons/fi'
import SyriaMap from '../components/SyriaMap/SyriaMap'
import governoratesService from '../services/governoratesService'
import citiesService from '../services/citiesService'
import { useSyriaMapData } from '../hooks/useSyriaMapData'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../contexts/LocaleContext'
import { MARKER_ZOOM_THRESHOLD } from '../utils/govMapsUtils'
import '../components/SyriaMap/SyriaMap.css'

const SyriaFarmsMap = () => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const [governorates, setGovernorates] = useState([])
  const [cities, setCities] = useState([])
  const [filters, setFilters] = useState({ governorateId: '', cityId: '' })

  const stableFilters = useMemo(
    () => ({
      governorateId: filters.governorateId || null,
      cityId: filters.cityId || null,
    }),
    [filters.governorateId, filters.cityId]
  )

  const { data, loading, error, setZoom, includeMarkers, reload } = useSyriaMapData('farms', stableFilters)

  useEffect(() => {
    governoratesService.getOptions(language).then(setGovernorates).catch(() => {})
  }, [language])

  useEffect(() => {
    if (!filters.governorateId) {
      setCities([])
      return
    }
    citiesService
      .getCitiesByGovernorate(filters.governorateId, { language })
      .then(setCities)
      .catch(() => setCities([]))
  }, [filters.governorateId, language])

  const summaries = data?.governorateSummaries || []

  const label = useCallback(
    (ar, en) => (language === 'ar' ? ar || en : en || ar),
    [language]
  )

  return (
    <div className="gov-entity-analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('syriaMaps.farmsTitle')}</h1>
          <p className="page-subtitle">{t('syriaMaps.farmsSubtitle')}</p>
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
            onChange={(e) =>
              setFilters({ governorateId: e.target.value, cityId: '' })
            }
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
          <label>{t('syriaMaps.city')}</label>
          <select
            className="filter-select"
            value={filters.cityId}
            disabled={!filters.governorateId}
            onChange={(e) => setFilters((prev) => ({ ...prev, cityId: e.target.value }))}
          >
            <option value="">{t('common.all')}</option>
            {cities.map((c) => (
              <option key={c.cityId} value={c.cityId}>
                {c.name}
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
              mapKind="farms"
              height={560}
              language={language}
              onZoomChange={setZoom}
            />
          )}
        </div>

        <aside className="syria-map-sidebar card">
          <h3>{t('syriaMaps.governorateSummary')}</h3>
          {!summaries.length && !loading && (
            <p className="gov-product-meta">{t('common.noData')}</p>
          )}
          {summaries.map((gov) => (
            <div key={gov.governorateId} className="gov-product-row">
              <strong>{label(gov.nameAr, gov.nameEn)}</strong>
              <div className="gov-product-meta">
                {t('syriaMaps.farmers')}: {gov.farmerCount} · {t('syriaMaps.farms')}: {gov.farmCount}
              </div>
              <div className="gov-product-meta">
                {t('syriaMaps.totalArea')}: {gov.totalAreaHectares} ha · {gov.offeredCropQuantityKg} kg
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

export default SyriaFarmsMap
