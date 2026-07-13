import { describe, it, expect } from 'vitest'
import { normalizeGovAnalyticsPayload, mergeAnalyticsFilters } from './govAnalyticsNormalize'

describe('govAnalyticsNormalize', () => {
  it('normalizes KPI payload', () => {
    const result = normalizeGovAnalyticsPayload(
      {
        visualizationType: 'kpi',
        data: {
          value: 125000,
          unitAr: 'كغ',
          unitEn: 'kg',
          changePercent: 27.6,
        },
      },
      'ar'
    )
    expect(result.kind).toBe('kpi')
    expect(result.value).toContain('125')
    expect(result.change).toBe(27.6)
  })

  it('normalizes column chart to bar series', () => {
    const result = normalizeGovAnalyticsPayload(
      {
        visualizationType: 'column',
        data: {
          categories: ['دمشق', 'حلب'],
          series: [
            { nameAr: 'معروض', nameEn: 'Supply', data: [5000, 3200] },
            { nameAr: 'طلب', nameEn: 'Demand', data: [4100, 2800] },
          ],
        },
      },
      'ar'
    )
    expect(result.kind).toBe('chart')
    expect(result.chartType).toBe('bar')
    expect(result.data).toHaveLength(2)
    expect(result.dataKeys).toHaveLength(2)
  })

  it('normalizes donut to pie chart rows', () => {
    const result = normalizeGovAnalyticsPayload(
      {
        visualizationType: 'donut',
        data: {
          slices: [
            { nameAr: 'مزادات', value: 40 },
            { nameAr: 'مباشر', value: 60 },
          ],
        },
      },
      'ar'
    )
    expect(result.kind).toBe('chart')
    expect(result.chartType).toBe('pie')
    expect(result.data[0].name).toBe('مزادات')
  })

  it('merges global and widget filters', () => {
    expect(
      mergeAnalyticsFilters({ days: 30, governorateId: '5' }, { topN: 10 })
    ).toEqual({
      days: 30,
      topN: 10,
      governorateId: 5,
    })
  })

  it('defaults topN to 70 for product ranking reports', () => {
    expect(
      mergeAnalyticsFilters({ days: 30 }, {}, { reportId: 'most-demanded-products' })
    ).toEqual({
      days: 30,
      topN: 70,
    })
  })

  it('attaches detailTable when includeDetail=true', () => {
    const result = normalizeGovAnalyticsPayload(
      {
        visualizationType: 'line',
        data: {
          categories: ['2026-05-01'],
          series: [{ nameAr: 'متوسط', data: [1250] }],
        },
        detailTable: {
          columns: [
            { key: 'date', titleAr: 'التاريخ', titleEn: 'Date' },
            { key: 'avgPrice', titleAr: 'متوسط السعر', titleEn: 'Avg price' },
          ],
          rows: [{ date: '2026-05-01', avgPrice: 1250 }],
          totalRows: 1,
        },
      },
      'ar'
    )
    expect(result.kind).toBe('chart')
    expect(result.detailTable?.rows).toHaveLength(1)
    expect(result.detailTable.columns[0].header).toBe('التاريخ')
    expect(result.detailTable.columns[0].accessor).toBe('date')
  })

  it('omits detailTable when not provided', () => {
    const result = normalizeGovAnalyticsPayload(
      {
        visualizationType: 'kpi',
        data: { value: 100, unitAr: 'كغ' },
        detailTable: null,
      },
      'ar'
    )
    expect(result.detailTable).toBeUndefined()
  })

  describe('PascalCase API payloads (real backend shape)', () => {
    it('KPI: VisualizationType/Data/Value -> kpi with value', () => {
      const result = normalizeGovAnalyticsPayload(
        {
          ReportId: 'total-revenue',
          VisualizationType: 'kpi',
          Data: { Value: 2546684424403.0, UnitAr: 'ل.س', UnitEn: 'SYP', PreviousValue: 0, ChangePercent: null, Items: null },
          DetailTable: null,
        },
        'ar'
      )
      expect(result.kind).toBe('kpi')
      expect(result.value).not.toBe('—')
      expect(result.value).toContain('ل.س')
    })

    it('column: PascalCase Categories/Series -> bar chart', () => {
      const result = normalizeGovAnalyticsPayload(
        {
          VisualizationType: 'column',
          Data: {
            Categories: ['دمشق', 'حلب'],
            Series: [{ Key: 'supply', NameAr: 'معروض', NameEn: 'Supply', Data: [5000, 3200] }],
          },
        },
        'ar'
      )
      expect(result.kind).toBe('chart')
      expect(result.data).toHaveLength(2)
      expect(result.dataKeys).toHaveLength(1)
      expect(result.data[0].supply).toBe(5000)
    })

    it('donut: PascalCase Slices -> pie', () => {
      const result = normalizeGovAnalyticsPayload(
        { VisualizationType: 'donut', Data: { Slices: [{ NameAr: 'مزادات', Value: 40 }, { NameAr: 'مباشر', Value: 60 }] } },
        'ar'
      )
      expect(result.kind).toBe('chart')
      expect(result.data[0].name).toBe('مزادات')
      expect(result.data[0].value).toBe(40)
    })

    it('table: PascalCase Columns/Rows -> table', () => {
      const result = normalizeGovAnalyticsPayload(
        {
          VisualizationType: 'table',
          Data: {
            Columns: [{ Key: 'productName', TitleAr: 'الصنف', TitleEn: 'Product' }, { Key: 'total', TitleAr: 'الإجمالي', TitleEn: 'Total' }],
            Rows: [{ productName: 'بندورة', total: 500 }],
            TotalRows: 1,
          },
        },
        'ar'
      )
      expect(result.kind).toBe('table')
      expect(result.columns).toHaveLength(2)
      expect(result.rows).toHaveLength(1)
      expect(result.columns[0].header).toBe('الصنف')
    })

    it('nested envelope: response.data with PascalCase', () => {
      const result = normalizeGovAnalyticsPayload(
        { Data: { VisualizationType: 'kpi', Data: { Value: 100, UnitAr: 'كغ' } } },
        'ar'
      )
      expect(result.kind).toBe('kpi')
      expect(result.value).toContain('100')
    })
  })
})
