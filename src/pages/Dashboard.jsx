import React, { useEffect, useMemo, useState } from 'react'
import {
  buildGovernorateLookup,
  resolveGovernorateLabel,
} from '../utils/governorateNames'
import {
  FiUsers,
  FiDollarSign,
  FiShoppingCart,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiPackage,
  FiActivity,
  FiGlobe,
  FiAlertCircle,
} from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import DashboardErrorBoundary from '../components/DashboardErrorBoundary/DashboardErrorBoundary'
import { useTranslation } from '../hooks/useTranslation'
import Chart from '../components/Chart/Chart'
import Table from '../components/Table/Table'
import { useAutoFillData, useRealTimeData } from '../hooks/useDashboardData'
import governoratesService from '../services/governoratesService'
import dashboardService from '../services/dashboardService'
import { fmtNum, safeNum } from '../utils/dashboardNormalize'
import './Dashboard.css'

const formatShortDate = (iso, locale = 'ar') => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  } catch {
    return String(iso)
  }
}

const DashboardContent = () => {
  const { t, language } = useTranslation()
  const locale = language === 'ar' ? 'ar' : 'en-US'
  const [selectedDays, setSelectedDays] = useState(30) // 0 = all times
  const [governorateId, setGovernorateId] = useState('')
  const [governorateOptions, setGovernorateOptions] = useState([])
  const [productionByCategory, setProductionByCategory] = useState([])
  const [topProductsByProduction, setTopProductsByProduction] = useState([])

  useEffect(() => {
    let cancelled = false
    governoratesService.getOptions(language).then((opts) => {
      if (!cancelled) setGovernorateOptions(opts)
    })
    return () => {
      cancelled = true
    }
  }, [language])

  const governorateLookup = useMemo(
    () => buildGovernorateLookup(governorateOptions),
    [governorateOptions]
  )

  const govParams = useMemo(
    () => ({
      days: selectedDays > 0 ? selectedDays : undefined,
      governorateId: governorateId ? Number(governorateId) : undefined,
    }),
    [selectedDays, governorateId]
  )

  const { data: dashboard, loading, error, refresh } = useAutoFillData(govParams, {
    pollIntervalMs: 60000,
  })

  const { data: realTime, loading: rtLoading } = useRealTimeData(30000)

  const market = dashboard?.marketAnalysis
  const overview = dashboard?.overview
  const sales = dashboard?.salesMetrics
  const todayStats = realTime?.todayStats
  const openNow = realTime?.openNow
  const period = dashboard?.period
  const dashboardYear = useMemo(() => {
    if (period?.endDate) {
      const d = new Date(period.endDate)
      if (!Number.isNaN(d.getTime())) return d.getFullYear()
    }
    return new Date().getFullYear()
  }, [period?.endDate])

  useEffect(() => {
    let cancelled = false

    const unwrap = (res) => res?.data?.data ?? res?.data ?? res

    const fetchGovCharts = async () => {
      try {
        const [categoryRes, topProductsRes] = await Promise.all([
          dashboardService.getProductionByCategory({ year: dashboardYear }),
          dashboardService.getTopProductsByProduction({ year: dashboardYear, topN: 15 }),
        ])

        if (cancelled) return

        const categoryData = unwrap(categoryRes)
        const topProductsData = unwrap(topProductsRes)
        const slices = Array.isArray(categoryData?.slices) ? categoryData.slices : []
        const categories = Array.isArray(topProductsData?.categories) ? topProductsData.categories : []
        const seriesValues = Array.isArray(topProductsData?.series?.[0]?.data)
          ? topProductsData.series[0].data
          : []

        setProductionByCategory(
          slices.map((slice) => ({
            name:
              (language === 'ar' ? slice.nameAr : slice.nameEn) ||
              slice.nameAr ||
              slice.nameEn ||
              t('dashboard.unknown'),
            value: safeNum(slice.value),
            percentage: safeNum(slice.percentage),
          }))
        )

        setTopProductsByProduction(
          categories.map((name, idx) => ({
            name,
            value: safeNum(seriesValues[idx]),
          }))
        )
      } catch {
        if (!cancelled) {
          setProductionByCategory([])
          setTopProductsByProduction([])
        }
      }
    }

    fetchGovCharts()
    return () => {
      cancelled = true
    }
  }, [dashboardYear, language, t])

  const revenueSparkline = useMemo(() => {
    const rows = market?.revenueSparkline
    if (!Array.isArray(rows)) return []
    return rows.map((item) => ({
      date: formatShortDate(item.date, locale),
      value: safeNum(item.value),
    }))
  }, [market, locale])

  const priceTrendsData = useMemo(() => {
    const rows = dashboard?.priceTrends
    if (!Array.isArray(rows)) return []
    return rows.map((item) => ({
      date: formatShortDate(item.date, locale),
      price: safeNum(item.avgPrice),
    }))
  }, [dashboard, locale])

  const transactionsByType = useMemo(() => {
    const rows = dashboard?.transactionsByType
    if (!Array.isArray(rows)) return []
    const labels = {
      direct: t('dashboard.directSales'),
      auction: t('dashboard.auctions'),
      tender: t('dashboard.tenders'),
    }
    return rows.map((item) => ({
      name: labels[item.type] || item.type,
      value: safeNum(item.count),
    }))
  }, [dashboard, t])

  const topProducts = useMemo(() => {
    const rows = dashboard?.topProducts
    if (!Array.isArray(rows)) return []
    return rows.slice(0, 10).map((p) => ({
      name: p.nameAr || p.nameEn || `#${p.productId}`,
      volume: fmtNum(p.totalVolume),
      revenue: `$${fmtNum(p.totalRevenue)}`,
      avgPrice: `$${fmtNum(p.avgPrice)}`,
      transactions: fmtNum(p.transactions),
    }))
  }, [dashboard])

  const topProductsColumns = [
    { header: t('common.name'), accessor: 'name' },
    { header: t('dashboard.soldQty'), accessor: 'volume' },
    { header: t('dashboard.totalRevenue'), accessor: 'revenue' },
    { header: t('dashboard.averagePrice'), accessor: 'avgPrice' },
    { header: t('dashboard.totalTransactions'), accessor: 'transactions' },
  ]

  const topGovernorates = useMemo(() => {
    const rows = dashboard?.topGovernorates
    if (!Array.isArray(rows)) return []
    return rows.map((g) => ({
      governorate:
        resolveGovernorateLabel(g.governorate ?? g.governorateId, governorateLookup, language) ||
        t('dashboard.unknown'),
      totalValue: safeNum(g.totalValue),
      totalVolume: safeNum(g.totalVolume),
      transactions: safeNum(g.transactions),
    }))
  }, [dashboard, t, governorateLookup, language])

  const governorateChartData = useMemo(
    () =>
      topGovernorates.map((g) => ({
        governorate: g.governorate,
        sales: g.totalValue,
        volume: g.totalVolume,
      })),
    [topGovernorates]
  )

  const governorateColumns = [
    { header: t('dashboard.governorate'), accessor: 'governorate' },
    { header: t('dashboard.totalRevenue'), accessor: 'totalValue' },
    { header: t('dashboard.soldQty'), accessor: 'totalVolume' },
    { header: t('dashboard.totalTransactions'), accessor: 'transactions' },
  ]

  const recentActivity = useMemo(() => {
    const activity = dashboard?.recentActivity
    if (!activity) return []
    const rows = []
    const pushRows = (items, typeLabel) => {
      if (!Array.isArray(items)) return
      items.slice(0, 5).forEach((item) => {
        rows.push({
          type: typeLabel,
          id: item.id != null ? `#${item.id}` : '—',
          title: item.title || '—',
          status: typeof item.status === 'string' ? item.status : '—',
          createdAt: item.createdAt
            ? new Date(item.createdAt).toLocaleString(locale)
            : '—',
        })
      })
    }
    pushRows(activity.auctions, t('dashboard.auctions'))
    pushRows(activity.tenders, t('dashboard.tenders'))
    pushRows(activity.listings, t('dashboard.listings'))
    return rows.slice(0, 12)
  }, [dashboard, t, locale])

  const activityColumns = [
    {
      header: t('dashboard.type'),
      accessor: 'type',
      render: (v) => <span className="badge badge-primary">{v}</span>,
    },
    { header: 'ID', accessor: 'id' },
    { header: t('dashboard.columnTitle'), accessor: 'title' },
    {
      header: t('common.status'),
      accessor: 'status',
      render: (v) => <span className="badge badge-success">{v}</span>,
    },
    { header: t('dashboard.createdAt'), accessor: 'createdAt' },
  ]

  const lowStock = dashboard?.inventory?.lowStockProducts
  const lowStockList = Array.isArray(lowStock) ? lowStock.slice(0, 5) : []

  const revenueChange = safeNum(sales?.revenueChange ?? sales?.revenueChangePercent)

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.governmentDashboard')}</h1>
          <p className="page-subtitle">{t('dashboard.realtimeOverview')}</p>
          {period && (
            <p className="dashboard-period">
              {formatShortDate(period.startDate, locale)} — {formatShortDate(period.endDate, locale)}
              {' · '}
              {period.days != null
                ? `${period.days} ${t('dashboard.daysLabel')}`
                : t('dashboard.allTimes')}
            </p>
          )}
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={governorateId}
            onChange={(e) => setGovernorateId(e.target.value)}
            title={t('dashboard.filterGovernorate')}
          >
            <option value="">{t('dashboard.allGovernorates')}</option>
            {governorateOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
          >
            <option value={7}>{t('dashboard.last7Days')}</option>
            <option value={30}>{t('dashboard.last30Days')}</option>
            <option value={60}>{t('dashboard.last60Days')}</option>
            <option value={90}>{t('dashboard.last90Days')}</option>
            <option value={0}>{t('dashboard.allTimes')}</option>
          </select>
          <button type="button" className="btn btn-outline" onClick={refresh} disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message card">
          <p>⚠️ {error}</p>
          <button type="button" className="btn btn-primary" onClick={refresh}>
            {t('common.retry')}
          </button>
        </div>
      )}

      {loading && !dashboard && (
        <div className="dashboard-skeleton">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-chart" />
        </div>
      )}

      {dashboard && (
        <>
          {sales && (
            <div className="sales-today-row">
              <div className="sales-today-card glass-card card">
                <span className="sales-label">{t('dashboard.revenueToday')}</span>
                <span className="sales-value">${fmtNum(sales.today?.revenue)}</span>
                <span className="sales-meta">
                  {fmtNum(sales.today?.transactions)} {t('dashboard.totalTransactions')}
                </span>
              </div>
              <div className="sales-today-card card highlight">
                <span className="sales-label">{t('dashboard.revenueChange')}</span>
                <span className={`sales-value ${revenueChange >= 0 ? 'up' : 'down'}`}>
                  {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                </span>
                {revenueChange >= 0 ? (
                  <FiTrendingUp className="sales-trend-icon" />
                ) : (
                  <FiTrendingDown className="sales-trend-icon" />
                )}
              </div>
              <div className="sales-today-card glass-card card">
                <span className="sales-label">{t('dashboard.revenueYesterday')}</span>
                <span className="sales-value neutral">${fmtNum(sales.yesterday?.revenue)}</span>
                <span className="sales-meta">
                  {fmtNum(sales.yesterday?.transactions)} {t('dashboard.totalTransactions')}
                </span>
              </div>
            </div>
          )}

          <div className="stats-grid">
            <StatCard
              title={t('dashboard.totalRevenue')}
              value={`$${fmtNum(market?.totalRevenue?.value)}`}
              change={market?.totalRevenue?.changePercentage}
              icon={<FiDollarSign />}
              color="success"
            />
            <StatCard
              title={t('dashboard.totalTransactions')}
              value={fmtNum(market?.totalTransactions?.value)}
              change={market?.totalTransactions?.changePercentage}
              icon={<FiShoppingCart />}
              color="primary"
            />
            <StatCard
              title={t('dashboard.totalVolume')}
              value={`${fmtNum(market?.totalVolume?.value)} kg`}
              change={market?.totalVolume?.changePercentage}
              icon={<FiPackage />}
              color="warning"
            />
            <StatCard
              title={t('dashboard.averagePrice')}
              value={`$${fmtNum(market?.averagePrice?.value)}/kg`}
              change={market?.averagePrice?.changePercentage}
              icon={<FiTrendingUp />}
              color="danger"
            />
          </div>

          {(todayStats || openNow) && (
            <div className="realtime-banner">
              <div className="realtime-banner-header">
                <h3>
                  <span className="live-pulse" />
                  {t('dashboard.todaysActivity')}
                </h3>
                {!rtLoading && realTime?.timestamp && (
                  <span className="realtime-banner-meta">
                    {t('dashboard.lastUpdated')}:{' '}
                    {new Date(realTime.timestamp).toLocaleTimeString(locale)}
                  </span>
                )}
              </div>
              {todayStats && (
                <div className="realtime-stats">
                  <div className="realtime-stat">
                    <span className="realtime-value">{fmtNum(todayStats.newUsers)}</span>
                    <span className="realtime-label">{t('dashboard.newUsers')}</span>
                  </div>
                  <div className="realtime-stat">
                    <span className="realtime-value">{fmtNum(todayStats.newAuctions)}</span>
                    <span className="realtime-label">{t('dashboard.newAuctions')}</span>
                  </div>
                  <div className="realtime-stat">
                    <span className="realtime-value">{fmtNum(todayStats.newTenders)}</span>
                    <span className="realtime-label">{t('dashboard.newTenders')}</span>
                  </div>
                  <div className="realtime-stat">
                    <span className="realtime-value">{fmtNum(todayStats.totalBids)}</span>
                    <span className="realtime-label">{t('dashboard.totalBids')}</span>
                  </div>
                  <div className="realtime-stat">
                    <span className="realtime-value">{fmtNum(todayStats.totalOffers)}</span>
                    <span className="realtime-label">{t('dashboard.totalOffers')}</span>
                  </div>
                </div>
              )}
              {openNow && (
                <div className="open-now-marquee">
                  <p>
                    📍 {t('dashboard.openNow')}: {fmtNum(openNow.openAuctions)}{' '}
                    {t('dashboard.auctions')} · {fmtNum(openNow.openTenders)}{' '}
                    {t('dashboard.tenders')} · {fmtNum(openNow.activeListings)}{' '}
                    {t('dashboard.listings')}
                  </p>
                </div>
              )}
              <p className="realtime-hint">{t('dashboard.todaysActivityHint')}</p>
            </div>
          )}

          {overview && (
            <div className="overview-grid">
              <div className="overview-card-stitch card">
                <FiUsers className="overview-icon-stitch" />
                <span className="overview-value-stitch">{fmtNum(overview.totalUsers)}</span>
                <span className="overview-label-stitch">
                  {t('dashboard.totalUsers')} ({t('dashboard.active30d')}: {fmtNum(overview.activeUsers30Days)})
                </span>
              </div>
              <div className="overview-card-stitch card">
                <FiGlobe className="overview-icon-stitch" />
                <span className="overview-value-stitch">{fmtNum(overview.totalFarms)}</span>
                <span className="overview-label-stitch">
                  {t('dashboard.totalFarms')} ({t('dashboard.inventory')}: {fmtNum(overview.totalInventory)} kg)
                </span>
              </div>
              <div className="overview-card-stitch card">
                <FiActivity className="overview-icon-stitch" />
                <span className="overview-value-stitch">{fmtNum(overview.openAuctions)}</span>
                <span className="overview-label-stitch">
                  {t('dashboard.openAuctions')} ({t('dashboard.tenders')}: {fmtNum(overview.openTenders)})
                </span>
              </div>
              <div className="overview-card-stitch card">
                <FiPackage className="overview-icon-stitch" />
                <span className="overview-value-stitch">{fmtNum(overview.activeListings)}</span>
                <span className="overview-label-stitch">
                  {t('dashboard.activeListings')} ({t('dashboard.newToday')}: {fmtNum(overview.newUsersToday)})
                </span>
              </div>
            </div>
          )}

          <div className="charts-grid charts-grid-compact">
            {revenueSparkline.length > 0 && (
              <Chart
                type="area"
                data={revenueSparkline}
                dataKey="value"
                xAxisKey="date"
                xAxisLabel={t('dashboard.dateAxis')}
                title={t('dashboard.revenueTrends')}
                color="#15803d"
                height={260}
                scrollable
              />
            )}
            {priceTrendsData.length > 0 && (
              <Chart
                type="line"
                data={priceTrendsData}
                dataKey="price"
                xAxisKey="date"
                xAxisLabel={t('dashboard.dateAxis')}
                yAxisLabel={t('dashboard.averagePrice')}
                title={t('dashboard.priceTrends')}
                color="#00652c"
                height={260}
                scrollable
              />
            )}
            {transactionsByType.length > 0 && (
              <Chart
                type="bar"
                data={transactionsByType}
                dataKey="value"
                xAxisKey="name"
                title={t('dashboard.transactionsByType')}
                color="#059669"
                height={260}
              />
            )}
            {productionByCategory.length > 0 && (
              <Chart
                type="pie"
                data={productionByCategory}
                dataKey="value"
                nameKey="name"
                title={t('dashboard.productionByCategory')}
                height={280}
                pieLabel
                tooltipFormatter={(value, _, item) => {
                  const pct = safeNum(item?.payload?.percentage)
                  return [`${fmtNum(value)} ${t('dashboard.tonsUnit')} (${pct.toFixed(1)}%)`, t('dashboard.production')]
                }}
              />
            )}
            {topProductsByProduction.length > 0 && (
              <Chart
                type="bar"
                data={topProductsByProduction}
                dataKey="value"
                xAxisKey="name"
                title={t('dashboard.topProductsByProduction')}
                xAxisLabel={t('dashboard.product')}
                yAxisLabel={t('dashboard.thousandTonsUnit')}
                height={300}
                scrollable
                tooltipFormatter={(value) => [`${fmtNum(value)} ${t('dashboard.thousandTonsUnit')}`, t('dashboard.production')]}
              />
            )}
          </div>

          {topProducts.length > 0 && (
            <div className="section-table-wrap">
              <div className="section-table-header">
                <h2>{t('dashboard.topProductsByRevenue')}</h2>
              </div>
              <Table columns={topProductsColumns} data={topProducts} />
            </div>
          )}

          {topGovernorates.length > 0 && (
            <div className="section">
              <h2 className="section-title">{t('dashboard.activityByGovernorate')}</h2>
              {governorateChartData.length > 0 && (
                <Chart
                  type="bar"
                  data={governorateChartData}
                  dataKeys={[
                    { dataKey: 'sales', name: t('dashboard.totalRevenue'), color: '#15803d' },
                    { dataKey: 'volume', name: t('dashboard.soldQty'), color: '#059669' },
                  ]}
                  xAxisKey="governorate"
                  xAxisLabel={t('dashboard.governorate')}
                  yAxisLabel={t('dashboard.chartValueAxis')}
                  title={t('dashboard.governorateSalesChart')}
                  height={320}
                />
              )}
              <Table
                columns={governorateColumns}
                data={topGovernorates.map((g) => ({
                  ...g,
                  totalValue: `$${fmtNum(g.totalValue)}`,
                  totalVolume: `${fmtNum(g.totalVolume)} kg`,
                  transactions: fmtNum(g.transactions),
                }))}
              />
            </div>
          )}

          {recentActivity.length > 0 && (
            <div className="section-table-wrap">
              <div className="section-table-header">
                <h2>{t('dashboard.recentActivity')}</h2>
              </div>
              <Table columns={activityColumns} data={recentActivity} />
            </div>
          )}

          {lowStockList.length > 0 && (
            <div className="low-stock-alert">
              <div className="low-stock-alert-icon">
                <FiAlertCircle />
              </div>
              <div className="low-stock-alert-body">
                <h3>{t('dashboard.lowStockProducts')}</h3>
                <p>{t('dashboard.lowStockHint')}</p>
                <div className="low-stock-tags">
                  {lowStockList.map((product, index) => (
                    <span className="low-stock-tag" key={product.productId ?? index}>
                      {product.productName || `Product ${product.productId}`}:{' '}
                      {fmtNum(product.quantityOnHand)} kg
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const Dashboard = () => {
  const [retryKey, setRetryKey] = useState(0)
  return (
    <DashboardErrorBoundary onRetry={() => setRetryKey((k) => k + 1)} key={retryKey}>
      <DashboardContent />
    </DashboardErrorBoundary>
  )
}

export default Dashboard
