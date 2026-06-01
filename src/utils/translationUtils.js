const OVERRIDES_STORAGE_KEY = 'app-translation-overrides'

export function flattenTranslations(obj, prefix = '') {
  const result = {}
  if (!obj || typeof obj !== 'object') return result

  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenTranslations(val, path))
    } else if (val != null) {
      result[path] = String(val)
    }
  }
  return result
}

export function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
}

export function deepMergeTranslations(base, flatOverrides) {
  const merged = JSON.parse(JSON.stringify(base))
  for (const [path, value] of Object.entries(flatOverrides || {})) {
    if (value !== undefined && value !== null && value !== '') {
      setNestedValue(merged, path, value)
    }
  }
  return merged
}

export function loadTranslationOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY)
    if (!raw) return { ar: {}, en: {} }
    const parsed = JSON.parse(raw)
    return {
      ar: parsed.ar && typeof parsed.ar === 'object' ? parsed.ar : {},
      en: parsed.en && typeof parsed.en === 'object' ? parsed.en : {},
    }
  } catch {
    return { ar: {}, en: {} }
  }
}

export function saveTranslationOverrides(overrides) {
  localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides))
}

export function getNamespace(key) {
  return key.split('.')[0] || 'other'
}

export function groupKeysByNamespace(flatMap) {
  const groups = {}
  for (const key of Object.keys(flatMap)) {
    const ns = getNamespace(key)
    if (!groups[ns]) groups[ns] = []
    groups[ns].push(key)
  }
  for (const ns of Object.keys(groups)) {
    groups[ns].sort()
  }
  return groups
}
