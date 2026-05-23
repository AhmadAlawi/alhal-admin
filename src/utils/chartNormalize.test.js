import { describe, it, expect } from 'vitest'
import {
  formatPriceTrendsChart,
  formatSupplyDemandChart,
  formatPriceVolatilityChart,
  formatDistributionChart,
  formatDirectListingPrice,
  formatAuctionCandleChart,
  resolveAuctionDisplayPrice,
  normalizeChartDateKey,
  hasChartData,
} from './chartNormalize'

describe('chartNormalize', () => {
  it('joins min/max price series by normalized date', () => {
    const raw = {
      averagePrice: [
        { date: '2026-05-22T10:00:00Z', value: 3200 },
        { date: '2026-05-23', value: 3350 },
      ],
      minPrice: [{ date: '2026-05-22T10:00:00.000Z', value: 3100 }],
      maxPrice: [{ date: '2026-05-23T00:00:00Z', value: 3400 }],
    }
    const rows = formatPriceTrendsChart(raw, 'en-US')
    expect(rows).toHaveLength(2)
    expect(rows[0].minPrice).toBe(3100)
    expect(rows[0].avgPrice).toBe(3200)
    expect(rows[1].maxPrice).toBe(3400)
  })

  it('aligns supply and demand by date key', () => {
    const raw = {
      supply: [{ date: '2026-05-01', value: 100 }],
      demand: [{ date: '2026-05-01T12:00:00Z', value: 80 }],
    }
    const rows = formatSupplyDemandChart(raw, 'en-US')
    expect(rows[0].supply).toBe(100)
    expect(rows[0].demand).toBe(80)
  })

  it('formats price volatility points', () => {
    const rows = formatPriceVolatilityChart({
      data: [{ date: '2026-05-01', volatility: 12.5 }],
    })
    expect(rows[0].volatility).toBe(12.5)
  })

  it('builds pie distribution with name and value', () => {
    const { data, nameKey, valueKey } = formatDistributionChart([
      { category: 'direct', count: 10 },
      { category: 'auction', count: 5 },
    ])
    expect(nameKey).toBe('name')
    expect(valueKey).toBe('value')
    expect(data[0].name).toBe('direct')
    expect(data[0].value).toBe(10)
  })

  it('uses totalPrice for direct listings (not unit × qty)', () => {
    const { totalPrice, pricePerUnit, qty } = formatDirectListingPrice({
      price: 1500000,
      availableQty: 500,
    })
    expect(totalPrice).toBe(1500000)
    expect(qty).toBe(500)
    expect(pricePerUnit).toBe(3000)
  })

  it('prefers per-unit auction price over lot total', () => {
    expect(
      resolveAuctionDisplayPrice({
        currentPrice: 1675000,
        currentPricePerUnit: 3350,
      })
    ).toBe(3350)
  })

  it('formats OHLC candles for charts', () => {
    const rows = formatAuctionCandleChart([
      {
        time: '2026-05-22T10:00:00Z',
        open: 3200,
        high: 3350,
        low: 3200,
        close: 3350,
        bidCount: 3,
      },
    ])
    expect(rows[0].close).toBe(3350)
    expect(rows[0].volume).toBe(3)
  })

  it('normalizeChartDateKey strips time', () => {
    expect(normalizeChartDateKey('2026-05-22T10:00:00Z')).toBe('2026-05-22')
  })

  it('hasChartData guards empty arrays', () => {
    expect(hasChartData([])).toBe(false)
    expect(hasChartData([{ a: 1 }])).toBe(true)
  })
})
