import { useCallback, useEffect, useState } from 'react'
import govMapsService from '../services/govMapsService'
import { MARKER_ZOOM_THRESHOLD, unwrapMapPayload, SYRIA_DEFAULT_CENTER } from '../utils/govMapsUtils'

export function useSyriaMapData(mapKind, filters = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(SYRIA_DEFAULT_CENTER.zoom)
  const includeMarkers = zoom >= MARKER_ZOOM_THRESHOLD

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fn = mapKind === 'products' ? govMapsService.getProductsMap : govMapsService.getFarmsMap
      const res = await fn(filters, { includeMarkers })
      setData(unwrapMapPayload(res))
    } catch (e) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [mapKind, filters, includeMarkers])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, zoom, setZoom, includeMarkers, reload: load }
}
