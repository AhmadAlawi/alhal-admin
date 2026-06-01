import { BASE_CURRENCY_CODE, getCurrencyPreset } from '../config/currencies'

/**
 * Convert amount stored in SYP to display currency.
 * @param {number} amountSyp - value from API (always SYP)
 * @param {number} exchangeRate - how many SYP equal 1 unit of display currency (e.g. 15000 for USD)
 */
export function convertFromSyp(amountSyp, displayCode, exchangeRate) {
  const n = Number(amountSyp)
  if (!Number.isFinite(n)) return 0
  if (!displayCode || displayCode === BASE_CURRENCY_CODE) return n
  const rate = Number(exchangeRate)
  if (!Number.isFinite(rate) || rate <= 0) return n
  return n / rate
}

export function formatNumber(value, locale = 'ar-SY', options = {}) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(locale, {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    ...options,
  })
}

/**
 * Format a monetary value (stored in SYP) for display.
 */
export function formatCurrency(amountSyp, options = {}) {
  const {
    displayCode = BASE_CURRENCY_CODE,
    exchangeRate = 1,
    locale = 'ar-SY',
    language = 'ar',
    showCode = false,
    decimals,
  } = options

  const preset = getCurrencyPreset(displayCode)
  const converted = convertFromSyp(amountSyp, displayCode, exchangeRate)
  const fractionDigits =
    decimals ?? (displayCode === BASE_CURRENCY_CODE ? 0 : 2)

  const formatted = formatNumber(converted, locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

  const symbol =
    language === 'ar' ? preset.symbol : preset.symbolEn || preset.symbol

  if (showCode) return `${formatted} ${preset.code}`
  return `${formatted} ${symbol}`
}

/** Price per kg/unit label */
export function formatPricePerUnit(amountSyp, unit = 'kg', options = {}) {
  return `${formatCurrency(amountSyp, options)}/${unit}`
}
