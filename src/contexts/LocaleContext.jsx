import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  loadTranslationOverrides,
  saveTranslationOverrides,
} from '../utils/translationUtils'

const LocaleContext = createContext()

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}

export const LocaleProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app-language') || 'ar'
  })

  const [direction, setDirection] = useState(language === 'ar' ? 'rtl' : 'ltr')
  const [translationOverrides, setTranslationOverrides] = useState(loadTranslationOverrides)

  useEffect(() => {
    document.documentElement.dir = direction
    document.documentElement.lang = language

    if (direction === 'rtl') {
      document.body.classList.add('rtl')
      document.body.classList.remove('ltr')
    } else {
      document.body.classList.add('ltr')
      document.body.classList.remove('rtl')
    }
  }, [direction, language])

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang)
    setDirection(lang === 'ar' ? 'rtl' : 'ltr')
    localStorage.setItem('app-language', lang)
  }, [])

  const persistOverrides = useCallback((next) => {
    setTranslationOverrides(next)
    saveTranslationOverrides(next)
    window.dispatchEvent(new CustomEvent('translation-overrides-changed'))
  }, [])

  const setTranslationOverride = useCallback(
    (lang, key, value) => {
      const next = {
        ...translationOverrides,
        [lang]: { ...translationOverrides[lang], [key]: value },
      }
      persistOverrides(next)
    },
    [translationOverrides, persistOverrides]
  )

  const removeTranslationOverride = useCallback(
    (lang, key) => {
      const langMap = { ...translationOverrides[lang] }
      delete langMap[key]
      persistOverrides({ ...translationOverrides, [lang]: langMap })
    },
    [translationOverrides, persistOverrides]
  )

  const resetTranslationOverrides = useCallback(
    (lang) => {
      if (lang) {
        persistOverrides({ ...translationOverrides, [lang]: {} })
      } else {
        persistOverrides({ ar: {}, en: {} })
      }
    },
    [translationOverrides, persistOverrides]
  )

  const importTranslationOverrides = useCallback(
    (data) => {
      const next = {
        ar: { ...translationOverrides.ar, ...(data.ar || {}) },
        en: { ...translationOverrides.en, ...(data.en || {}) },
      }
      persistOverrides(next)
    },
    [translationOverrides, persistOverrides]
  )

  const value = useMemo(
    () => ({
      language,
      direction,
      changeLanguage,
      isRTL: direction === 'rtl',
      translationOverrides,
      setTranslationOverride,
      removeTranslationOverride,
      resetTranslationOverrides,
      importTranslationOverrides,
    }),
    [
      language,
      direction,
      changeLanguage,
      translationOverrides,
      setTranslationOverride,
      removeTranslationOverride,
      resetTranslationOverrides,
      importTranslationOverrides,
    ]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
