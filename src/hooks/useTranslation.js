import { useCallback, useEffect, useMemo } from 'react'
import { useLocale } from '../contexts/LocaleContext'
import enTranslations from '../locales/en.json'
import arTranslations from '../locales/ar.json'

const translations = {
  en: enTranslations,
  ar: arTranslations
}

export const useTranslation = () => {
  const { language } = useLocale()
  const t = useMemo(() => translations[language] || translations.ar, [language])

  const translate = useCallback((key, params = {}) => {
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
  }, [t])

  return { t: translate, language }
}

