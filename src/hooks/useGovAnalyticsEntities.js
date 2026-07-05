import { useEffect, useState } from 'react'
import govAnalyticsService from '../services/govAnalyticsService'
import { unwrapAnalyticsList } from '../utils/govAnalyticsNormalize'
import { FALLBACK_GOV_ENTITIES } from '../config/entityAnalyticsNav'

let cachedEntities = null
let inflight = null

async function fetchEntities() {
  if (cachedEntities) return cachedEntities
  if (inflight) return inflight

  inflight = govAnalyticsService
    .getEntities()
    .then((res) => {
      const list = unwrapAnalyticsList(res)
      cachedEntities = list.length > 0 ? list : FALLBACK_GOV_ENTITIES
      inflight = null
      return cachedEntities
    })
    .catch(() => {
      cachedEntities = FALLBACK_GOV_ENTITIES
      inflight = null
      return cachedEntities
    })

  return inflight
}

export function clearGovAnalyticsEntitiesCache() {
  cachedEntities = null
  inflight = null
}

export function useGovAnalyticsEntities({ enabled = true } = {}) {
  const [entities, setEntities] = useState(cachedEntities || [])
  const [loading, setLoading] = useState(enabled && !cachedEntities)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false

    if (cachedEntities) {
      setEntities(cachedEntities)
      setLoading(false)
      return undefined
    }

    setLoading(true)
    fetchEntities()
      .then((list) => {
        if (!cancelled) {
          setEntities(list)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setEntities(FALLBACK_GOV_ENTITIES)
          setError(e.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return { entities, loading, error }
}

export function getEntityId(entity) {
  return entity?.entityId || entity?.EntityId || entity?.id || entity?.Id || ''
}

export function getEntityLabel(entity, language = 'ar') {
  if (!entity) return ''
  return language === 'ar'
    ? entity.nameAr || entity.NameAr || entity.titleAr || getEntityId(entity)
    : entity.nameEn || entity.NameEn || entity.titleEn || getEntityId(entity)
}
