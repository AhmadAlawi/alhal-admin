import React, { createContext, useContext, useState, useEffect } from 'react'

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
    // Get saved language from localStorage or default to Arabic
    return localStorage.getItem('app-language') || 'ar'
  })

  const [direction, setDirection] = useState(language === 'ar' ? 'rtl' : 'ltr')

  useEffect(() => {
    // Update document direction and lang attribute
    document.documentElement.dir = direction
    document.documentElement.lang = language
    
    // Update body class for RTL styling
    if (direction === 'rtl') {
      document.body.classList.add('rtl')
      document.body.classList.remove('ltr')
    } else {
      document.body.classList.add('ltr')
      document.body.classList.remove('rtl')
    }
  }, [direction, language])

  const changeLanguage = (lang) => {
    setLanguage(lang)
    setDirection(lang === 'ar' ? 'rtl' : 'ltr')
    localStorage.setItem('app-language', lang)
  }

  const value = {
    language,
    direction,
    changeLanguage,
    isRTL: direction === 'rtl'
  }

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

