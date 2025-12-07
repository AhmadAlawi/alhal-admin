import { useState, useEffect } from 'react'
import { useLocale } from '../contexts/LocaleContext'
import enTranslations from '../locales/en.json'
import arTranslations from '../locales/ar.json'

const translations = {
  en: enTranslations,
  ar: arTranslations
}

export const useTranslation = () => {
  const { language } = useLocale()
  const [t, setT] = useState(() => translations[language] || translations.ar)

  useEffect(() => {
    setT(translations[language] || translations.ar)
  }, [language])

  const translate = (key, params = {}) => {
    const keys = key.split('.')
    let value = t

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }

    // Replace parameters in the translation string
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match
      })
    }

    return value || key
  }

  return { t: translate, language }
}

