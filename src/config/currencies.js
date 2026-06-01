/** Base currency — all API amounts are stored in Syrian Pounds. */
export const BASE_CURRENCY_CODE = 'SYP'

export const CURRENCY_PRESETS = [
  {
    code: 'SYP',
    nameAr: 'الليرة السورية',
    nameEn: 'Syrian Pound',
    symbol: 'ل.س',
    symbolEn: 'SYP',
    defaultExchangeRate: 1,
  },
  {
    code: 'USD',
    nameAr: 'الدولار الأمريكي',
    nameEn: 'US Dollar',
    symbol: '$',
    symbolEn: 'USD',
    defaultExchangeRate: 15000,
  },
  {
    code: 'EUR',
    nameAr: 'اليورو',
    nameEn: 'Euro',
    symbol: '€',
    symbolEn: 'EUR',
    defaultExchangeRate: 16000,
  },
  {
    code: 'TRY',
    nameAr: 'الليرة التركية',
    nameEn: 'Turkish Lira',
    symbol: '₺',
    symbolEn: 'TRY',
    defaultExchangeRate: 450,
  },
  {
    code: 'SAR',
    nameAr: 'الريال السعودي',
    nameEn: 'Saudi Riyal',
    symbol: 'ر.س',
    symbolEn: 'SAR',
    defaultExchangeRate: 4000,
  },
  {
    code: 'AED',
    nameAr: 'الدرهم الإماراتي',
    nameEn: 'UAE Dirham',
    symbol: 'د.إ',
    symbolEn: 'AED',
    defaultExchangeRate: 4100,
  },
]

export function getCurrencyPreset(code) {
  return CURRENCY_PRESETS.find((c) => c.code === code) || CURRENCY_PRESETS[0]
}
