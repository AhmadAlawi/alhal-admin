import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  SYRIA_DEFAULT_CENTER,
  SYRIA_BOUNDS,
  SYRIA_MAP_MIN_ZOOM,
  SYRIA_MAP_MAX_ZOOM,
  MARKER_ZOOM_THRESHOLD,
  circleRadius,
  getBoundsLatLng,
  quantityColor,
  computeFarmMapTotals,
  computeProductMapTotals,
  getGovernorateMapPosition,
  getProductGovernoratePosition,
} from '../../utils/govMapsUtils'
import {
  FarmStatsPanel,
  ProductStatsPanel,
  MarkerStatTooltip,
  ProductGovernorateTooltip,
  CropMarkerTooltip,
} from './SyriaMapFarmStats'
import './SyriaMap.css'

const HAL_ICON = L.divIcon({
  className: 'syria-map-hal-icon',
  html: '<span class="hal-pin">🏛</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
})

function SyriaMapViewport({ bounds, fitBounds, pickMode }) {
  const map = useMap()
  const syriaBounds = useMemo(
    () =>
      L.latLngBounds(
        [SYRIA_BOUNDS.minLatitude, SYRIA_BOUNDS.minLongitude],
        [SYRIA_BOUNDS.maxLatitude, SYRIA_BOUNDS.maxLongitude]
      ),
    []
  )

  useEffect(() => {
    map.setMaxBounds(syriaBounds)
    map.setMinZoom(SYRIA_MAP_MIN_ZOOM)
    map.setMaxZoom(SYRIA_MAP_MAX_ZOOM)
    map.options.maxBoundsViscosity = 1
  }, [map, syriaBounds])

  useEffect(() => {
    if (pickMode) {
      map.fitBounds(syriaBounds, { padding: [12, 12], maxZoom: 8 })
      return
    }
    if (!fitBounds) return

    const apiBounds = getBoundsLatLng(bounds)
    if (apiBounds) {
      map.fitBounds(apiBounds, { padding: [24, 24], maxZoom: 11 })
    } else {
      map.fitBounds(syriaBounds, { padding: [12, 12], maxZoom: 8 })
    }
  }, [bounds, fitBounds, pickMode, map, syriaBounds])

  return null
}

function MapZoomTracker({ onZoomChange }) {
  const map = useMapEvents({
    zoomend: () => onZoomChange?.(map.getZoom()),
  })
  useEffect(() => {
    onZoomChange?.(map.getZoom())
  }, [map, onZoomChange])
  return null
}

function MapClickPicker({ onPick, enabled }) {
  useMapEvents({
    click(e) {
      if (!enabled) return
      onPick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    },
  })
  return null
}

const SyriaMap = ({
  data,
  mapKind = 'farms',
  height = 480,
  fitBounds = true,
  onZoomChange,
  pickMode = false,
  onPick,
  pickMarker,
  language = 'ar',
  showLegend = true,
}) => {
  const halCenters = data?.halMarketCenters || []
  const governorateSummaries = data?.governorateSummaries || []
  const citySummaries = data?.citySummaries || []
  const farmMarkers = data?.farmMarkers || []
  const cropMarkers = data?.cropMarkers || []
  const governorateProducts = data?.governorateProducts || []

  const govProductMax = useMemo(
    () =>
      Math.max(
        ...governorateProducts.map((g) => Number(g.totalOfferedQuantityKg) || 0),
        1
      ),
    [governorateProducts]
  )

  const govSummaryById = useMemo(() => {
    const map = new Map()
    governorateSummaries.forEach((g) => map.set(g.governorateId, g))
    return map
  }, [governorateSummaries])

  const label = (ar, en) => (language === 'ar' ? ar || en : en || ar)

  const farmTotals = useMemo(
    () => (mapKind === 'farms' ? computeFarmMapTotals(data) : null),
    [mapKind, data]
  )

  const productTotals = useMemo(
    () => (mapKind === 'products' ? computeProductMapTotals(data) : null),
    [mapKind, data]
  )

  const [currentZoom, setCurrentZoom] = useState(SYRIA_DEFAULT_CENTER.zoom)
  const showDetailLabels = currentZoom >= MARKER_ZOOM_THRESHOLD

  const handleZoomChange = (zoom) => {
    setCurrentZoom(zoom)
    onZoomChange?.(zoom)
  }

  return (
    <div className="syria-map-wrap" style={{ height }}>
      <MapContainer
        center={[SYRIA_DEFAULT_CENTER.lat, SYRIA_DEFAULT_CENTER.lng]}
        zoom={SYRIA_DEFAULT_CENTER.zoom}
        minZoom={SYRIA_MAP_MIN_ZOOM}
        maxZoom={SYRIA_MAP_MAX_ZOOM}
        maxBounds={[
          [SYRIA_BOUNDS.minLatitude, SYRIA_BOUNDS.minLongitude],
          [SYRIA_BOUNDS.maxLatitude, SYRIA_BOUNDS.maxLongitude],
        ]}
        maxBoundsViscosity={1}
        className="syria-map-container"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <SyriaMapViewport bounds={data?.bounds} fitBounds={fitBounds} pickMode={pickMode} />
        <MapZoomTracker onZoomChange={handleZoomChange} />
        <MapClickPicker onPick={onPick} enabled={pickMode} />

        {halCenters.map((center) => {
          if (center.latitude == null || center.longitude == null) return null
          const id = center.halMarketCenterId ?? center.id
          return (
            <Marker
              key={`hal-${id}`}
              position={[center.latitude, center.longitude]}
              icon={HAL_ICON}
            >
              <Tooltip permanent direction="top" className="syria-map-stat-tooltip hal">
                <strong>{label(center.nameAr, center.nameEn)}</strong>
              </Tooltip>
            </Marker>
          )
        })}

        {mapKind === 'farms' &&
          governorateSummaries.map((gov) => {
            const position = getGovernorateMapPosition(gov, halCenters, citySummaries)
            if (!position) return null
            const summary = govSummaryById.get(gov.governorateId) || gov
            const govName = label(summary.nameAr, summary.nameEn)
            return (
              <CircleMarker
                key={`gov-sum-${gov.governorateId}`}
                center={position}
                radius={circleRadius(summary.farmCount, 14, 32)}
                pathOptions={{
                  color: '#1d4ed8',
                  fillColor: '#93c5fd',
                  fillOpacity: 0.45,
                  weight: 2,
                }}
              >
                <Tooltip permanent direction="center" className="syria-map-stat-tooltip gov">
                  <MarkerStatTooltip
                    title={govName}
                    farmers={summary.farmerCount}
                    farms={summary.farmCount}
                    areaHectares={summary.totalAreaHectares}
                    language={language}
                  />
                </Tooltip>
              </CircleMarker>
            )
          })}

        {mapKind === 'farms' &&
          citySummaries.map((city) => {
            if (city.centroidLatitude == null || city.centroidLongitude == null) return null
            const cityName = label(city.nameAr, city.nameEn)
            return (
              <CircleMarker
                key={`city-${city.cityId}`}
                center={[city.centroidLatitude, city.centroidLongitude]}
                radius={circleRadius(city.farmCount)}
                pathOptions={{
                  color: '#15803d',
                  fillColor: '#22c55e',
                  fillOpacity: 0.5,
                  weight: 1,
                }}
              >
                <Tooltip
                  permanent={showDetailLabels}
                  direction="top"
                  className="syria-map-stat-tooltip"
                >
                  <MarkerStatTooltip
                    title={cityName}
                    farmers={city.farmerCount}
                    farms={city.farmCount}
                    areaHectares={city.totalAreaHectares}
                    language={language}
                  />
                </Tooltip>
              </CircleMarker>
            )
          })}

        {mapKind === 'farms' &&
          farmMarkers.map((farm) => (
            <CircleMarker
              key={`farm-${farm.farmId}`}
              center={[farm.latitude, farm.longitude]}
              radius={6}
              pathOptions={{ color: '#166534', fillColor: '#4ade80', fillOpacity: 0.9, weight: 1 }}
            >
              <Tooltip
                permanent={showDetailLabels}
                direction="top"
                className="syria-map-stat-tooltip farm"
              >
                <MarkerStatTooltip
                  title={farm.farmName}
                  farmers={1}
                  farms={1}
                  areaHectares={farm.areaHectares}
                  language={language}
                />
              </Tooltip>
            </CircleMarker>
          ))}

        {mapKind === 'products' &&
          governorateProducts.map((gov) => {
            const position = getProductGovernoratePosition(gov, halCenters, cropMarkers)
            if (!position) return null
            const qty = Number(gov.totalOfferedQuantityKg) || 0
            return (
              <CircleMarker
                key={`gov-prod-${gov.governorateId}`}
                center={position}
                radius={circleRadius(qty / 500, 14, 38)}
                pathOptions={{
                  color: '#92400e',
                  fillColor: quantityColor(qty, govProductMax),
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              >
                <Tooltip permanent direction="center" className="syria-map-stat-tooltip products">
                  <ProductGovernorateTooltip gov={gov} language={language} />
                </Tooltip>
              </CircleMarker>
            )
          })}

        {mapKind === 'products' &&
          cropMarkers.map((crop) => (
            <CircleMarker
              key={`crop-${crop.cropId}`}
              center={[crop.latitude, crop.longitude]}
              radius={7}
              pathOptions={{ color: '#b45309', fillColor: '#fbbf24', fillOpacity: 0.95, weight: 1 }}
            >
              <Tooltip
                permanent={showDetailLabels}
                direction="top"
                className="syria-map-stat-tooltip crop"
              >
                <CropMarkerTooltip crop={crop} language={language} />
              </Tooltip>
            </CircleMarker>
          ))}

        {pickMarker?.latitude != null && pickMarker?.longitude != null && (
          <CircleMarker
            center={[pickMarker.latitude, pickMarker.longitude]}
            radius={10}
            pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.8, weight: 2 }}
          />
        )}
      </MapContainer>

      {mapKind === 'farms' && !pickMode && (
        <FarmStatsPanel totals={farmTotals} language={language} />
      )}

      {mapKind === 'products' && !pickMode && (
        <ProductStatsPanel totals={productTotals} language={language} />
      )}

      {showLegend && !pickMode && (
        <div className="syria-map-legend">
          <span className="legend-item hal">🏛 {language === 'ar' ? 'مركز سوق الهال' : 'Hal market'}</span>
          {mapKind === 'farms' && (
            <>
              <span className="legend-item city">{language === 'ar' ? 'مدينة' : 'City'}</span>
              <span className="legend-item farm">{language === 'ar' ? 'مزرعة' : 'Farm'}</span>
            </>
          )}
          {mapKind === 'products' && (
            <>
              <span className="legend-item gov">{language === 'ar' ? 'محافظة (منتجات)' : 'Governorate (products)'}</span>
              <span className="legend-item crop">{language === 'ar' ? 'محصول' : 'Crop'}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SyriaMap
