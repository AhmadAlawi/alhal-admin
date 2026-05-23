import { describe, it, expect } from 'vitest'
import {
  extractReportRows,
  buildReportChartConfig,
  extractReportSummary,
} from './reportChartNormalize'

describe('extractReportRows', () => {
  it('unwraps nested data arrays', () => {
    expect(extractReportRows({ data: [{ name: 'A', value: 1 }] })).toHaveLength(1)
  })

  it('converts flat numeric map to rows', () => {
    const rows = extractReportRows({ cash: 120, card: 80, wallet: 40 })
    expect(rows).toEqual([
      { name: 'cash', value: 120 },
      { name: 'card', value: 80 },
      { name: 'wallet', value: 40 },
    ])
  })

  it('returns empty for null', () => {
    expect(extractReportRows(null)).toEqual([])
  })
})

describe('buildReportChartConfig', () => {
  it('builds time series for revenue report', () => {
    const raw = {
      summary: { totalRevenue: 5000 },
      data: [
        { date: '2024-01-01', revenue: 100 },
        { date: '2024-01-02', revenue: 200 },
      ],
    }
    const config = buildReportChartConfig(raw, 'revenue', 'en-US')
    expect(config.kind).toBe('area')
    expect(config.rows).toHaveLength(2)
    expect(config.dataKey).toBe('revenue')
  })

  it('builds distribution for payment methods', () => {
    const raw = { cash: 50, card: 30 }
    const config = buildReportChartConfig(raw, 'payment-methods', 'en-US')
    expect(config.kind).toBe('distribution')
    expect(config.rows.length).toBeGreaterThan(0)
  })

  it('builds bar chart for top products', () => {
    const raw = {
      data: [
        { productName: 'Tomato', totalSales: 900 },
        { productName: 'Potato', totalSales: 600 },
      ],
    }
    const config = buildReportChartConfig(raw, 'top-products', 'en-US')
    expect(config.kind).toBe('bar')
    expect(config.rows[0].name).toBe('Tomato')
  })

  it('builds composed chart for profit-loss with multiple metrics', () => {
    const raw = {
      data: [
        { date: '2024-01-01', revenue: 1000, expenses: 400, profit: 600 },
        { date: '2024-01-02', revenue: 1200, expenses: 500, profit: 700 },
      ],
    }
    const config = buildReportChartConfig(raw, 'profit-loss', 'en-US')
    expect(config.kind).toBe('composed')
    expect(config.dataKeys.length).toBeGreaterThan(1)
  })
})

describe('extractReportSummary', () => {
  it('reads summary object', () => {
    expect(extractReportSummary({ summary: { total: 10 } }, [])).toEqual({ total: 10 })
  })
})
