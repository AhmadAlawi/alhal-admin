import { useEffect, useMemo, useState } from 'react'
import reportsService from '../services/reportsService'
import reportBuilderService from '../services/reportBuilderService'
import { getSharedAutoFillData, getSharedProductionByCategory } from '../services/dashboardDataCache'
import { getCachedAnalyticsReport } from '../services/govAnalyticsCache'
import { buildReportChartConfig } from '../utils/reportChartNormalize'
import { mergeAnalyticsFilters, normalizeGovAnalyticsPayload } from '../utils/govAnalyticsNormalize'
import {
  buildChartPropsFromResults,
  extractVisualization,
  stripQueryDefinition,
} from '../utils/reportBuilderUtils'
import { getNestedValue, safeNum, globalFiltersToQueryParams } from '../utils/customDashboardUtils'
import { fmtNum } from '../utils/dashboardNormalize'

const UNKNOWN_LABEL = { ar: 'غير معروف', en: 'Unknown' }

const TX_LABELS = {
  ar: { direct: 'مبيعات مباشرة', auction: 'مزادات', tender: 'مناقصات' },
  en: { direct: 'Direct sales', auction: 'Auctions', tender: 'Tenders' },
}

const formatShortDate = (iso, locale = 'ar') => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  } catch {
    return String(iso)
  }
}

function buildGovParams(globalFilters) {
  const days = globalFilters?.days
  const governorateId = globalFilters?.governorateId
  return {
    days: days > 0 ? days : undefined,
    governorateId: governorateId ? Number(governorateId) : undefined,
  }
}

function formatKpiValue(value, format) {
  const n = safeNum(value?.value ?? value)
  switch (format) {
    case 'currency':
      return `$${fmtNum(n)}`
    case 'price':
      return `$${fmtNum(n)}/kg`
    case 'volume':
      return `${fmtNum(n)} kg`
    default:
      return fmtNum(n)
  }
}

async function fetchBuiltinDashboardData(globalFilters, language) {
  const params = buildGovParams(globalFilters)
  const dashboard = await getSharedAutoFillData(params)
  const year = dashboard?.period?.endDate
    ? new Date(dashboard.period.endDate).getFullYear()
    : new Date().getFullYear()

  let productionSlices = []
  try {
    productionSlices = await getSharedProductionByCategory(year)
  } catch {
    productionSlices = []
  }

  const locale = language === 'ar' ? 'ar' : 'en-US'
  const unknown = UNKNOWN_LABEL[language] || UNKNOWN_LABEL.ar
  const txLabels = TX_LABELS[language] || TX_LABELS.ar

  const productionByCategory = productionSlices.map((slice) => ({
    name:
      (language === 'ar' ? slice.nameAr : slice.nameEn) ||
      slice.nameAr ||
      slice.nameEn ||
      unknown,
    value: slice.value,
  }))

  return {
    raw: dashboard,
    overview: dashboard?.overview,
    market: dashboard?.marketAnalysis,
    charts: {
      revenueSparkline: (dashboard?.marketAnalysis?.revenueSparkline || []).map((item) => ({
        date: formatShortDate(item.date, locale),
        value: safeNum(item.value),
      })),
      priceTrends: (dashboard?.priceTrends || []).map((item) => ({
        date: formatShortDate(item.date, locale),
        price: safeNum(item.avgPrice),
      })),
      transactionsByType: (dashboard?.transactionsByType || []).map((item) => ({
        name: txLabels[item.type] || item.type,
        value: safeNum(item.count),
      })),
      productionByCategory,
    },
  }
}

const OVERVIEW_DETAIL_KEYS = {
  'overview-users': 'dashboard.active30d',
  'overview-farms': 'dashboard.inventory',
}

const OVERVIEW_DETAIL_FALLBACK = {
  ar: { 'dashboard.active30d': 'نشط 30 يوم', 'dashboard.inventory': 'المخزون' },
  en: { 'dashboard.active30d': 'Active 30d', 'dashboard.inventory': 'Inventory' },
}

function overviewDetailLabel(key, language) {
  const map = OVERVIEW_DETAIL_FALLBACK[language] || OVERVIEW_DETAIL_FALLBACK.ar
  return map[key] || key
}

export function useWidgetData(widget, globalFilters, { language, enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const widgetKey = useMemo(
    () =>
      JSON.stringify({
        id: widget?.id,
        type: widget?.type,
        config: widget?.config,
        globalFilters,
        language,
      }),
    [widget?.id, widget?.type, widget?.config, globalFilters, language]
  )

  useEffect(() => {
    if (!enabled || !widget) return undefined
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        if (
          widget.type === 'builtin-kpi' ||
          widget.type === 'builtin-chart' ||
          widget.type === 'builtin-overview'
        ) {
          const gov = await fetchBuiltinDashboardData(globalFilters, language)
          if (cancelled) return

          if (widget.type === 'builtin-kpi') {
            const metric = getNestedValue(gov.raw, widget.config.metric)
            setData({
              kind: 'kpi',
              value: formatKpiValue(metric, widget.config.format),
              change: metric?.changePercentage,
            })
          } else if (widget.type === 'builtin-overview') {
            const val = gov.overview?.[widget.config.field]
            const detail = gov.overview?.[widget.config.detailField]
            const detailLabel = overviewDetailLabel(widget.config.detailLabelKey, language)
            setData({
              kind: 'overview',
              value: fmtNum(val),
              detail: `${detailLabel}: ${fmtNum(detail)}${widget.config.suffix || ''}`,
            })
          } else {
            const chartData = gov.charts[widget.config.chartKey] || []
            setData({
              kind: 'chart',
              chartType: widget.config.chartType,
              data: chartData,
              dataKey: widget.config.dataKey,
              xAxisKey: widget.config.xAxisKey,
              nameKey: widget.config.nameKey,
            })
          }
          return
        }

        if (widget.type === 'predefined-report') {
          const fn = reportsService[widget.config.endpoint]
          if (typeof fn !== 'function') throw new Error('Report endpoint not found')
          const filters = {
            ...globalFiltersToQueryParams(globalFilters),
            page: 1,
            pageSize: 50,
          }
          const res = await fn(filters)
          const payload = res?.data ?? res
          const chartConfig = buildReportChartConfig(payload, {
            locale: language === 'ar' ? 'ar-SY' : 'en-US',
          })
          if (cancelled) return
          setData({
            kind: 'report',
            chartConfig,
            payload,
          })
          return
        }

        if (widget.type === 'saved-report') {
          const saved = await reportBuilderService.getSaved(widget.config.savedReportId)
          const raw = saved?.data ?? saved
          const definition = raw?.definition ?? raw?.data?.definition
          if (!definition) throw new Error('Saved report not found')
          const query = stripQueryDefinition(definition)
          const res = await reportBuilderService.execute(query)
          const results = res?.data ?? res
          const visualization = extractVisualization(definition)
          const chartProps = buildChartPropsFromResults(results, visualization)
          if (cancelled) return
          setData({
            kind: 'saved-report',
            chartProps,
            results,
            visualization,
          })
          return
        }

        if (widget.type === 'analytics-report') {
          const reportId = widget.config.reportId
          if (!reportId) throw new Error('Analytics report ID missing')
          const filters = mergeAnalyticsFilters(globalFilters, widget.config.filters || {})
          const payload = await getCachedAnalyticsReport(reportId, filters)
          const normalized = normalizeGovAnalyticsPayload(payload, language)
          if (cancelled) return
          setData({
            ...normalized,
            reportId,
            visualizationType: widget.config.visualizationType,
          })
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load widget')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [widgetKey, enabled, widget, globalFilters, language])

  return { data, loading, error }
}
