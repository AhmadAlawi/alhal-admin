import { useEffect, useMemo, useState } from 'react'
import dashboardService from '../services/dashboardService'
import reportsService from '../services/reportsService'
import reportBuilderService from '../services/reportBuilderService'
import { unwrapDashboardPayload } from '../utils/dashboardNormalize'
import { buildReportChartConfig } from '../utils/reportChartNormalize'
import {
  buildChartPropsFromResults,
  extractVisualization,
  stripQueryDefinition,
} from '../utils/reportBuilderUtils'
import { getNestedValue, safeNum, globalFiltersToQueryParams } from '../utils/customDashboardUtils'
import { fmtNum } from '../utils/dashboardNormalize'

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

async function fetchBuiltinDashboardData(globalFilters, language, t) {
  const params = buildGovParams(globalFilters)
  const res = await dashboardService.getAutoFillData(params)
  const dashboard = unwrapDashboardPayload(res)
  const year = dashboard?.period?.endDate
    ? new Date(dashboard.period.endDate).getFullYear()
    : new Date().getFullYear()

  let productionByCategory = []
  try {
    const catRes = await dashboardService.getProductionByCategory({ year })
    const data = catRes?.data?.data ?? catRes?.data ?? catRes
    const slices = Array.isArray(data?.slices) ? data.slices : []
    productionByCategory = slices.map((slice) => ({
      name:
        (language === 'ar' ? slice.nameAr : slice.nameEn) ||
        slice.nameAr ||
        slice.nameEn ||
        t('dashboard.unknown'),
      value: safeNum(slice.value),
    }))
  } catch {
    productionByCategory = []
  }

  const locale = language === 'ar' ? 'ar' : 'en-US'
  const txLabels = {
    direct: t('dashboard.directSales'),
    auction: t('dashboard.auctions'),
    tender: t('dashboard.tenders'),
  }

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

export function useWidgetData(widget, globalFilters, { language, t, enabled = true }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const widgetKey = useMemo(
    () => JSON.stringify({ widget, globalFilters }),
    [widget, globalFilters]
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
          const gov = await fetchBuiltinDashboardData(globalFilters, language, t)
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
            setData({
              kind: 'overview',
              value: fmtNum(val),
              detail: `${t(widget.config.detailLabelKey)}: ${fmtNum(detail)}${widget.config.suffix || ''}`,
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
          const chartConfig = buildReportChartConfig(payload, { locale: language === 'ar' ? 'ar-SY' : 'en-US' })
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
  }, [widgetKey, enabled, widget, globalFilters, language, t])

  return { data, loading, error }
}
