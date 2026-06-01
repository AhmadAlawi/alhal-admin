import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from '../contexts/LocaleContext'
import enTranslations from '../locales/en.json'
import arTranslations from '../locales/ar.json'
import { deepMergeTranslations } from '../utils/translationUtils'

const baseTranslations = {
  en: enTranslations,
  ar: arTranslations,
}

function buildMerged(language, overrides) {
  const base = baseTranslations[language] || baseTranslations.ar
  const langOverrides = overrides?.[language] || {}
  return deepMergeTranslations(base, langOverrides)
}

export const useTranslation = () => {
  const { language, translationOverrides } = useLocale()
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const handler = () => setRevision((r) => r + 1)
    window.addEventListener('translation-overrides-changed', handler)
    return () => window.removeEventListener('translation-overrides-changed', handler)
  }, [])

  const t = useMemo(
    () => buildMerged(language, translationOverrides),
    [language, translationOverrides, revision]
  )

  const translate = useCallback(
    (key, params = {}) => {
      const keys = key.split('.')
      let value = t

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          return key
        }
      }

      if (typeof value === 'string' && Object.keys(params).length > 0) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return params[paramKey] !== undefined ? params[paramKey] : match
        })
      }

      return value || key
    },
    [t]
  )

  return { t: translate, language }
}

export { baseTranslations, buildMerged }
