import apiClient from './api'
import { isAccessDeniedError } from './transportApiPaths'

/**
 * Try admin route first, then public. Throws the last error if both fail with 403.
 */
export async function getWithFallback(adminPath, publicPath, params = {}) {
  let lastErr
  for (const path of [adminPath, publicPath].filter(Boolean)) {
    try {
      return await apiClient.get(path, params)
    } catch (err) {
      lastErr = err
      if (!isAccessDeniedError(err)) throw err
    }
  }
  throw lastErr || new Error('Transport API access denied')
}

export async function postWithFallback(adminPath, publicPath, data) {
  let lastErr
  for (const path of [adminPath, publicPath].filter(Boolean)) {
    try {
      return await apiClient.post(path, data)
    } catch (err) {
      lastErr = err
      if (!isAccessDeniedError(err)) throw err
    }
  }
  throw lastErr || new Error('Transport API access denied')
}

export async function putWithFallback(adminPath, publicPath, data) {
  let lastErr
  for (const path of [adminPath, publicPath].filter(Boolean)) {
    try {
      return await apiClient.put(path, data)
    } catch (err) {
      lastErr = err
      if (!isAccessDeniedError(err)) throw err
    }
  }
  throw lastErr || new Error('Transport API access denied')
}

export async function deleteWithFallback(adminPath, publicPath) {
  let lastErr
  for (const path of [adminPath, publicPath].filter(Boolean)) {
    try {
      return await apiClient.delete(path)
    } catch (err) {
      lastErr = err
      if (!isAccessDeniedError(err)) throw err
    }
  }
  throw lastErr || new Error('Transport API access denied')
}

/** Single-path methods (no admin variant documented yet). */
export const transportDirect = {
  get: (path, params) => apiClient.get(path, params),
  post: (path, data) => apiClient.post(path, data),
  put: (path, data) => apiClient.put(path, data),
  delete: (path) => apiClient.delete(path),
}
