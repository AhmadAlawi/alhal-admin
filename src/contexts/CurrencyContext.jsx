import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocale } from './LocaleContext'
import {
  BASE_CURRENCY_CODE,
  CURRENCY_PRESETS,
  getCurrencyPreset,
} from '../config/currencies'
import {
  convertFromSyp,
  formatCurrency,
  formatNumber,
  formatPricePerUnit,
} from '../utils/currencyFormat'

const STORAGE_KEY = 'app-currency-settings'

const DEFAULT_SETTINGS = {
  displayCode: BASE_CURRENCY_CODE,
  /** How many SYP = 1 unit of display currency (e.g. 15000 → 1 USD = 15000 SYP) */
  exchangeRate: 1,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return {
      displayCode: parsed.displayCode || BASE_CURRENCY_CODE,
      exchangeRate: Number(parsed.exchangeRate) > 0 ? Number(parsed.exchangeRate) : 1,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const { language } = useLocale()
  const [settings, setSettings] = useState(loadSettings)

  const locale = language === 'ar' ? 'ar-SY' : 'en-US'
  const preset = getCurrencyPreset(settings.displayCode)
  const isBaseCurrency = settings.displayCode === BASE_CURRENCY_CODE

  const persist = useCallback((next) => {
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const setDisplayCurrency = useCallback(
    (displayCode, exchangeRate) => {
      const code = displayCode || BASE_CURRENCY_CODE
      const rate =
        code === BASE_CURRENCY_CODE
          ? 1
          : Number(exchangeRate) > 0
            ? Number(exchangeRate)
            : getCurrencyPreset(code).defaultExchangeRate
      persist({ displayCode: code, exchangeRate: rate })
    },
    [persist]
  )

  const setExchangeRate = useCallback(
    (rate) => {
      const n = Number(rate)
      if (!Number.isFinite(n) || n <= 0) return
      persist({ ...settings, exchangeRate: n })
    },
    [persist, settings]
  )

  const resetCurrency = useCallback(() => {
    persist({ ...DEFAULT_SETTINGS })
  }, [persist])

  const formatOpts = useMemo(
    () => ({
      displayCode: settings.displayCode,
      exchangeRate: settings.exchangeRate,
      locale,
      language,
    }),
    [settings.displayCode, settings.exchangeRate, locale, language]
  )

  const formatMoney = useCallback(
    (amountSyp, opts = {}) => formatCurrency(amountSyp, { ...formatOpts, ...opts }),
    [formatOpts]
  )

  const formatMoneyPerUnit = useCallback(
    (amountSyp, unit, opts = {}) =>
      formatPricePerUnit(amountSyp, unit, { ...formatOpts, ...opts }),
    [formatOpts]
  )

  const formatQty = useCallback(
    (value, opts = {}) => formatNumber(value, locale, opts),
    [locale]
  )

  const convert = useCallback(
    (amountSyp) =>
      convertFromSyp(amountSyp, settings.displayCode, settings.exchangeRate),
    [settings.displayCode, settings.exchangeRate]
  )

  const currencyLabel = useMemo(
    () => (language === 'ar' ? preset.symbol : preset.symbolEn || preset.code),
    [language, preset]
  )

  const value = useMemo(
    () => ({
      baseCurrencyCode: BASE_CURRENCY_CODE,
      displayCode: settings.displayCode,
      exchangeRate: settings.exchangeRate,
      isBaseCurrency,
      preset,
      presets: CURRENCY_PRESETS,
      currencyLabel,
      setDisplayCurrency,
      setExchangeRate,
      resetCurrency,
      formatMoney,
      formatMoneyPerUnit,
      formatQty,
      convert,
    }),
    [
      settings,
      isBaseCurrency,
      preset,
      currencyLabel,
      setDisplayCurrency,
      setExchangeRate,
      resetCurrency,
      formatMoney,
      formatMoneyPerUnit,
      formatQty,
      convert,
    ]
  )

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return ctx
}
