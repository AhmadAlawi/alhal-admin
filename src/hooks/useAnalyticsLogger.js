import { useCallback, useEffect, useRef } from 'react'
import analyticsService from '../services/analyticsService'
import authService from '../services/authService'

const MAX_BATCH_SIZE = 50
const FLUSH_INTERVAL_MS = 5000

const getSessionId = () => {
  const key = 'analyticsSessionId'
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const created = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  sessionStorage.setItem(key, created)
  return created
}

const getClientContext = () => ({
  appName: 'AlHalAdminWeb',
  appVersion: import.meta.env.VITE_APP_VERSION || 'web',
  platform: 'web',
  deviceBrand: navigator.vendor || 'unknown',
  deviceModel: navigator.userAgent,
  osVersion: navigator.platform || 'unknown',
})

export const useAnalyticsLogger = (screenName = 'unknown') => {
  const queueRef = useRef([])
  const sendingRef = useRef(false)
  const timerRef = useRef(null)
  const sessionIdRef = useRef(getSessionId())

  const flush = useCallback(async () => {
    if (sendingRef.current || queueRef.current.length === 0) return
    sendingRef.current = true
    const batch = queueRef.current.splice(0, MAX_BATCH_SIZE)
    try {
      await analyticsService.logEvents(batch)
    } catch {
      queueRef.current = [...batch, ...queueRef.current]
    } finally {
      sendingRef.current = false
    }
  }, [])

  const enqueueEvent = useCallback(
    (payload) => {
      const nowIso = new Date().toISOString()
      const userIdRaw = authService.getUserId()
      const userId = userIdRaw !== null && userIdRaw !== undefined ? Number(userIdRaw) || null : null

      queueRef.current.push({
        ...getClientContext(),
        userId,
        sessionId: sessionIdRef.current,
        timestamp: nowIso,
        event: {
          type: payload.type || 'custom_event',
          level: payload.level || 'info',
          screen: payload.screen || screenName,
          message: payload.message || '',
          metadata: payload.metadata || {},
          timestamp: nowIso,
        },
      })

      if (queueRef.current.length >= MAX_BATCH_SIZE) {
        flush()
      }
    },
    [flush, screenName]
  )

  useEffect(() => {
    timerRef.current = setInterval(() => {
      flush()
    }, FLUSH_INTERVAL_MS)

    const onHidden = () => {
      if (document.visibilityState === 'hidden') {
        flush()
      }
    }
    const onBeforeUnload = () => {
      flush()
    }

    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('beforeunload', onBeforeUnload)
      flush()
    }
  }, [flush])

  const logScreenView = useCallback(
    (metadata = {}) =>
      enqueueEvent({
        type: 'screen_view',
        screen: screenName,
        message: `Viewed ${screenName}`,
        metadata,
      }),
    [enqueueEvent, screenName]
  )

  const logButtonClick = useCallback(
    (action, metadata = {}) =>
      enqueueEvent({
        type: 'button_click',
        screen: screenName,
        message: `Clicked ${action}`,
        metadata: { action, ...metadata },
      }),
    [enqueueEvent, screenName]
  )

  const logApiError = useCallback(
    (message, metadata = {}) =>
      enqueueEvent({
        type: 'api_error',
        level: 'error',
        screen: screenName,
        message,
        metadata,
      }),
    [enqueueEvent, screenName]
  )

  return {
    enqueueEvent,
    logScreenView,
    logButtonClick,
    logApiError,
    flush,
  }
}

export default useAnalyticsLogger
