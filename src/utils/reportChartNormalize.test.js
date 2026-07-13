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

describe('PascalCase API payloads (real backend shape)', () => {
  it('sales/trends: nested Data + PascalCase fields -> timeseries', () => {
    const raw = {
      ReportType: 'Sales Trend Report',
      Data: [
        { Period: '2026-06-11', TotalSales: 13992268500, TotalQuantity: 6500, AveragePrice: 4653470.5, TransactionCount: 2 },
        { Period: '2026-06-12', TotalSales: 5000, TotalQuantity: 10, AveragePrice: 500, TransactionCount: 1 },
      ],
      Summary: { TotalPeriods: 9, GrowthRate: -17.8 },
    }
    const config = buildReportChartConfig(raw, 'sales-trends', 'en-US')
    expect(['composed', 'area']).toContain(config.kind)
    expect(config.rows).toHaveLength(2)
    expect(config.summary).toBeTruthy()
  })

  it('top-products: PascalCase rows -> bar with real labels', () => {
    const raw = {
      Data: [
        { ProductId: 37, ProductName: 'فاصولياء خضراء', TotalSales: 47427380000, TotalQuantity: 5000, TransactionCount: 1, AveragePrice: 9485476 },
      ],
      Summary: { TopN: 2, TotalSales: 64386921500 },
    }
    const config = buildReportChartConfig(raw, 'top-products', 'en-US')
    expect(config.kind).toBe('bar')
    expect(config.rows[0].name).toBe('فاصولياء خضراء')
    expect(config.rows[0].value).toBe(47427380000)
  })

  it('users/by-type: PascalCase -> distribution', () => {
    const raw = {
      Data: [
        { UserType: 'farmer', Count: 544, Percentage: 63.18 },
        { UserType: 'trader', Count: 200, Percentage: 23.2 },
      ],
      Summary: { TotalUsers: 861, UserTypes: 7 },
    }
    const config = buildReportChartConfig(raw, 'user-type', 'en-US')
    expect(config.kind).toBe('distribution')
    expect(config.rows.length).toBe(2)
    expect(config.rows.some((r) => r.name === 'farmer')).toBe(true)
  })

  it('empty Data -> empty kind, no throw', () => {
    const config = buildReportChartConfig({ Data: [], Summary: {} }, 'payment-methods', 'en-US')
    expect(config.kind).toBe('empty')
  })

  it('object reportId (widget caller) does not throw', () => {
    const raw = { Data: [{ ProductName: 'X', TotalSales: 5 }] }
    expect(() => buildReportChartConfig(raw, { locale: 'en-US' })).not.toThrow()
  })
})
