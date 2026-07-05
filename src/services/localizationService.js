import apiClient from './api'

const BASE = '/api/admin/localization'

const pick = (obj, ...keys) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k]
  }
  return undefined
}

export const normalizeTranslation = (row) => ({
  id: pick(row, 'id', 'Id', 'translationId', 'TranslationId'),
  languageCode: pick(row, 'languageCode', 'LanguageCode') ?? '',
  value: pick(row, 'value', 'Value') ?? '',
  isActive: pick(row, 'isActive', 'IsActive') !== false,
})

export const normalizeLocalizationKey = (row) => {
  const rawTranslations = row?.translations ?? row?.Translations ?? []
  const translations = Array.isArray(rawTranslations)
    ? rawTranslations.map(normalizeTranslation)
    : []

  return {
    id: pick(row, 'id', 'Id', 'localizationKeyId', 'LocalizationKeyId'),
    key: pick(row, 'key', 'Key') ?? '',
    category: pick(row, 'category', 'Category') ?? '',
    description: pick(row, 'description', 'Description') ?? '',
    isActive: pick(row, 'isActive', 'IsActive') !== false,
    translations,
  }
}

export const normalizeKeysListResponse = (response) => {
  const root = response?.data ?? response
  if (Array.isArray(root)) {
    return {
      items: root.map(normalizeLocalizationKey),
      totalCount: root.length,
      page: 1,
      pageSize: root.length,
      totalPages: 1,
    }
  }

  const items = root?.items ?? root?.keys ?? root?.data ?? []
  const list = Array.isArray(items) ? items.map(normalizeLocalizationKey) : []
  const pageSize = root?.pageSize ?? root?.PageSize ?? 50
  const totalCount = root?.totalCount ?? root?.TotalCount ?? root?.total ?? list.length
  const page = root?.page ?? root?.Page ?? 1
  const totalPages =
    root?.totalPages ??
    root?.TotalPages ??
    Math.max(1, Math.ceil(totalCount / pageSize))

  return { items: list, totalCount, page, pageSize, totalPages }
}

export const translationForLang = (keyRow, lang) =>
  keyRow?.translations?.find((t) => t.languageCode === lang)?.value ?? ''

const localizationService = {
  getLanguages: async () => {
    const response = await apiClient.get(`${BASE}/languages`)
    const data = response?.data ?? response
    if (Array.isArray(data)) return data
    return data?.languages ?? data?.items ?? []
  },

  getKeys: async (params = {}) => {
    const response = await apiClient.get(`${BASE}/keys`, params)
    return normalizeKeysListResponse(response)
  },

  getKeyById: async (id) => {
    const response = await apiClient.get(`${BASE}/keys/${id}`)
    const data = response?.data ?? response
    return normalizeLocalizationKey(data)
  },

  createKey: async (payload) => {
    const response = await apiClient.post(`${BASE}/keys`, payload)
    const data = response?.data ?? response
    return normalizeLocalizationKey(data)
  },

  updateKey: async (id, payload) => {
    const response = await apiClient.put(`${BASE}/keys/${id}`, payload)
    const data = response?.data ?? response
    return normalizeLocalizationKey(data)
  },

  deleteKey: async (id) => {
    return apiClient.delete(`${BASE}/keys/${id}`)
  },

  upsertTranslation: async (keyId, payload) => {
    const response = await apiClient.put(`${BASE}/keys/${keyId}/translations`, payload)
    const data = response?.data ?? response
    return data?.translation ? normalizeTranslation(data.translation) : normalizeTranslation(data)
  },

  deleteTranslation: async (translationId) => {
    return apiClient.delete(`${BASE}/translations/${translationId}`)
  },

  syncCatalog: async () => {
    return apiClient.post(`${BASE}/sync-catalog`, {})
  },

  clearCache: async () => {
    return apiClient.post(`${BASE}/cache/clear`, {})
  },
}

export default localizationService
