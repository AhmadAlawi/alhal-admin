import { describe, it, expect } from 'vitest'
import { convertFromSyp, formatCurrency } from './currencyFormat'

describe('currencyFormat', () => {
  it('returns same amount for SYP', () => {
    expect(convertFromSyp(15000, 'SYP', 15000)).toBe(15000)
  })

  it('converts SYP to USD using exchange rate', () => {
    expect(convertFromSyp(150000, 'USD', 15000)).toBe(10)
  })

  it('formats currency with symbol', () => {
    const result = formatCurrency(150000, {
      displayCode: 'USD',
      exchangeRate: 15000,
      locale: 'en-US',
      language: 'en',
    })
    expect(result).toContain('10')
    expect(result).toContain('USD')
  })
})
