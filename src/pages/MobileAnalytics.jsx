import React, { useEffect, useMemo, useState } from 'react'
import { FiFilter, FiRefreshCw, FiSmartphone } from 'react-icons/fi'
import Chart from '../components/Chart/Chart'
import Table from '../components/Table/Table'
import StatCard from '../components/StatCard/StatCard'
import analyticsService from '../services/analyticsService'
import marketAnalysisService from '../services/marketAnalysisService'
import { formatChartShortDate } from '../utils/chartNormalize'
import { useTranslation } from '../hooks/useTranslation'
import './MobileAnalytics.css'

const MobileAnalytics = () => {
  const { t, language } = useTranslation()
  const chartLocale = language === 'ar' ? 'ar' : 'en-US'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lineData, setLineData] = useState([])
  const [barData, setBarData] = useState([])
  const [heatmapData, setHeatmapData] = useState([])
  const [loggerRows, setLoggerRows] = useState([])
  const [statsData, setStatsData] = useState(null)
  const [eventsTrendData, setEventsTrendData] = useState([])
  const [topEventTypesData, setTopEventTypesData] = useState([])
  const [topScreensData, setTopScreensData] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 100, total: 0, totalPages: 0 })
  const [loggerUnavailable, setLoggerUnavailable] = useState('')

  const [filters, setFilters] = useState({
    allTime: false,
    from: '',
    to: '',
    productId: '',
    governorate: '',
    year: new Date().getFullYear(),
    userId: '',
    sessionId: '',
    eventType: '',
    eventLevel: '',
    screen: '',
    platform: '',
    appVersion: '',
    search: '',
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    top: 10,
  })

  const normalizeLineChart = (response) => {
    const payload = response?.data || response || {}
    const series = payload.series || {}
    const byDate = new Map()
    ;['auctions', 'tenders', 'orders'].forEach((key) => {
      const points = Array.isArray(series[key]) ? series[key] : []
      points.forEach((item) => {
        if (!item.date) return
        if (!byDate.has(item.date)) {
          byDate.set(item.date, { date: item.date, auctions: 0, tenders: 0, orders: 0 })
        }
        byDate.get(item.date)[key] = item.value || 0
      })
    })
    return Array.from(byDate.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((row) => ({
        ...row,
        date: formatChartShortDate(row.date, chartLocale),
      }))
  }

  const normalizeBarChart = (response) => {
    const payload = response?.data || response || {}
    const bars = Array.isArray(payload.bars) ? payload.bars : []
    return bars.map((bar) => ({
      label: bar.label || '-',
      value: bar.value || 0,
    }))
  }

  const normalizeHeatmap = (response) => {
    const payload = response?.data || response || {}
    const points = Array.isArray(payload.data) ? payload.data : []
    return points
      .map((item) => ({
        date: item.date,
        value: item.value || 0,
        intensity: item.intensity || 'low',
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const normalizeLogger = (response) => {
    const payload = response?.data || response || {}
    const rows = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : []
    const paginationInfo = payload.pagination || {}
    setPagination({
      page: paginationInfo.page || filters.page || 1,
      pageSize: paginationInfo.pageSize || filters.pageSize || 100,
      total: paginationInfo.total || rows.length || 0,
      totalPages: paginationInfo.totalPages || 1,
    })
    return rows.map((row) => ({
      id: row.id || '-',
      createdAt: row.createdAt || '-',
      at: row.clientTimestamp || row.timestamp || row.createdAt || '-',
      type: row.eventType || row.type || '-',
      level: row.eventLevel || row.level || '-',
      screen: row.screen || '-',
      message: row.message || '-',
      userId: row.userId ?? '-',
      sessionId: row.sessionId || '-',
      platform: row.platform || '-',
      appVersion: row.appVersion || '-',
    }))
  }

  const normalizeStats = (response) => {
    const payload = response?.data || response || {}
    const totals = payload.totals || {}
    const top = payload.top || {}
    const trend = payload.trend || {}
    setStatsData({
      totalEvents: totals.totalEvents || 0,
      uniqueUsers: totals.uniqueUsers || 0,
      uniqueSessions: totals.uniqueSessions || 0,
    })
    setTopEventTypesData(
      (Array.isArray(top.eventTypes) ? top.eventTypes : []).map((item) => ({
        name: item.key || item.name || item.label || '-',
        value: item.value || item.count || 0,
      }))
    )
    setTopScreensData(
      (Array.isArray(top.screens) ? top.screens : []).map((item) => ({
        name: item.key || item.name || item.label || '-',
        value: item.value || item.count || 0,
      }))
    )
    setEventsTrendData(
      (Array.isArray(trend.byDay) ? trend.byDay : []).map((item) => ({
        date: formatChartShortDate(item.date, chartLocale),
        value: item.value || item.count || 0,
      }))
    )
  }

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      setLoggerUnavailable('')

      const [lineRes, barRes, heatRes, loggerRes, statsRes] = await Promise.allSettled([
        analyticsService.getLineChart({
          from: filters.from,
          to: filters.to,
          allTime: filters.allTime,
        }),
        analyticsService.getBarChart({
          from: filters.from,
          to: filters.to,
          allTime: filters.allTime,
        }),
        marketAnalysisService.getSalesHeatmap({
          productId: filters.productId || undefined,
          governorate: filters.governorate || undefined,
          year: filters.year || undefined,
        }),
        analyticsService.getEvents({
          from: filters.from,
          to: filters.to,
          userId: filters.userId || undefined,
          sessionId: filters.sessionId || undefined,
          eventType: filters.eventType || undefined,
          eventLevel: filters.eventLevel || undefined,
          screen: filters.screen || undefined,
          platform: filters.platform || undefined,
          appVersion: filters.appVersion || undefined,
          search: filters.search || undefined,
          page: filters.page,
          pageSize: filters.pageSize,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        }),
        analyticsService.getEventsStats({
          from: filters.from,
          to: filters.to,
          userId: filters.userId || undefined,
          sessionId: filters.sessionId || undefined,
          eventType: filters.eventType || undefined,
          eventLevel: filters.eventLevel || undefined,
          screen: filters.screen || undefined,
          platform: filters.platform || undefined,
          appVersion: filters.appVersion || undefined,
          search: filters.search || undefined,
          top: filters.top,
        }),
      ])

      if (lineRes.status === 'fulfilled') setLineData(normalizeLineChart(lineRes.value))
      else setLineData([])

      if (barRes.status === 'fulfilled') setBarData(normalizeBarChart(barRes.value))
      else setBarData([])

      if (heatRes.status === 'fulfilled') setHeatmapData(normalizeHeatmap(heatRes.value))
      else setHeatmapData([])

      if (loggerRes.status === 'fulfilled') {
        setLoggerRows(normalizeLogger(loggerRes.value))
      } else {
        setLoggerRows([])
        setLoggerUnavailable(
          loggerRes.reason?.message || t('mobileAnalytics.loggerUnavailable')
        )
      }

      if (statsRes.status === 'fulfilled') {
        normalizeStats(statsRes.value)
      } else {
        setStatsData(null)
        setTopEventTypesData([])
        setTopScreensData([])
        setEventsTrendData([])
      }

      if (
        lineRes.status === 'rejected' &&
        barRes.status === 'rejected' &&
        heatRes.status === 'rejected'
      ) {
        setError(t('mobileAnalytics.loadDataError'))
      }
    } catch (err) {
      setError(err.message || t('mobileAnalytics.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (filters.page > 1) {
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page])

  const loggerColumns = useMemo(
    () => [
      {
        header: t('mobileAnalytics.logger.time'),
        accessor: 'at',
        render: (value) =>
          value && value !== '-'
            ? new Date(value).toLocaleString(chartLocale)
            : '-',
      },
      { header: t('mobileAnalytics.logger.type'), accessor: 'type' },
      { header: t('mobileAnalytics.logger.level'), accessor: 'level' },
      { header: t('mobileAnalytics.logger.screen'), accessor: 'screen' },
      { header: t('mobileAnalytics.logger.message'), accessor: 'message' },
      { header: t('mobileAnalytics.logger.user'), accessor: 'userId' },
      { header: t('mobileAnalytics.logger.session'), accessor: 'sessionId' },
      { header: t('mobileAnalytics.logger.platform'), accessor: 'platform' },
      { header: t('mobileAnalytics.logger.version'), accessor: 'appVersion' },
    ],
    [t, chartLocale]
  )

  const sortFieldOptions = [
    'createdAt',
    'clientTimestamp',
    'eventType',
    'eventLevel',
    'screen',
    'platform',
    'appVersion',
  ]

  return (
    <div className="mobile-analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiSmartphone /> {t('common.mobileAnalytics')}
          </h1>
          <p className="page-subtitle">{t('mobileAnalytics.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={load}>
          <FiRefreshCw /> {t('common.refresh')}
        </button>
      </div>

      <div className="card mobile-filters">
        <h3>
          <FiFilter /> {t('analytics.filters')}
        </h3>
        <div className="filters-grid">
          <label>
            {t('mobileAnalytics.allTime')}
            <input
              type="checkbox"
              checked={filters.allTime}
              onChange={(e) => setFilters((prev) => ({ ...prev, allTime: e.target.checked }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.from')}
            <input
              type="datetime-local"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
              disabled={filters.allTime}
            />
          </label>
          <label>
            {t('mobileAnalytics.to')}
            <input
              type="datetime-local"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
              disabled={filters.allTime}
            />
          </label>
          <label>
            {t('mobileAnalytics.heatmapYear')}
            <input
              type="number"
              min="2020"
              max="2100"
              value={filters.year}
              onChange={(e) => setFilters((prev) => ({ ...prev, year: Number(e.target.value) }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.productId')}
            <input
              type="number"
              value={filters.productId}
              onChange={(e) => setFilters((prev) => ({ ...prev, productId: e.target.value }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.governorate')}
            <input
              type="text"
              value={filters.governorate}
              onChange={(e) => setFilters((prev) => ({ ...prev, governorate: e.target.value }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.eventType')}
            <input
              type="text"
              placeholder={t('mobileAnalytics.eventTypePlaceholder')}
              value={filters.eventType}
              onChange={(e) => setFilters((prev) => ({ ...prev, eventType: e.target.value }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.eventLevel')}
            <input
              type="text"
              placeholder={t('mobileAnalytics.eventLevelPlaceholder')}
              value={filters.eventLevel}
              onChange={(e) => setFilters((prev) => ({ ...prev, eventLevel: e.target.value }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.screen')}
            <input
              type="text"
              placeholder={t('mobileAnalytics.screenPlaceholder')}
              value={filters.screen}
              onChange={(e) => setFilters((prev) => ({ ...prev, screen: e.target.value }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.userId')}
            <input
              type="number"
              value={filters.userId}
              onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.sessionId')}
            <input
              type="text"
              value={filters.sessionId}
              onChange={(e) => setFilters((prev) => ({ ...prev, sessionId: e.target.value }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.platform')}
            <input
              type="text"
              value={filters.platform}
              onChange={(e) => setFilters((prev) => ({ ...prev, platform: e.target.value }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.appVersion')}
            <input
              type="text"
              value={filters.appVersion}
              onChange={(e) => setFilters((prev) => ({ ...prev, appVersion: e.target.value }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.search')}
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </label>
          <label>
            {t('mobileAnalytics.sortBy')}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
            >
              {sortFieldOptions.map((field) => (
                <option key={field} value={field}>
                  {t(`mobileAnalytics.sortFields.${field}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('mobileAnalytics.sortOrder')}
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortOrder: e.target.value }))}
            >
              <option value="desc">{t('common.desc')}</option>
              <option value="asc">{t('common.asc')}</option>
            </select>
          </label>
        </div>
        <div className="filters-actions">
          <button type="button" className="btn btn-primary" onClick={load}>
            {t('common.applyFilters')}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-message card">
          <p>{t('mobileAnalytics.loading')}</p>
        </div>
      )}
      {error && (
        <div className="error-message card">
          <p>⚠️ {error}</p>
        </div>
      )}

      {statsData && (
        <div className="stats-grid">
          <StatCard
            title={t('mobileAnalytics.totalEvents')}
            value={String(statsData.totalEvents)}
            color="primary"
          />
          <StatCard
            title={t('mobileAnalytics.uniqueUsers')}
            value={String(statsData.uniqueUsers)}
            color="success"
          />
          <StatCard
            title={t('mobileAnalytics.uniqueSessions')}
            value={String(statsData.uniqueSessions)}
            color="warning"
          />
        </div>
      )}

      <div className="charts-grid">
        {eventsTrendData.length > 0 && (
          <Chart
            type="line"
            data={eventsTrendData}
            dataKey="value"
            xAxisKey="date"
            title={t('mobileAnalytics.loggerTrend')}
            color="#16a34a"
            height={280}
          />
        )}
        {topEventTypesData.length > 0 && (
          <Chart
            type="bar"
            data={topEventTypesData}
            dataKey="value"
            xAxisKey="name"
            title={t('mobileAnalytics.topEventTypes')}
            color="#22c55e"
            height={280}
          />
        )}
      </div>
      <div className="charts-grid">
        {topScreensData.length > 0 && (
          <Chart
            type="bar"
            data={topScreensData}
            dataKey="value"
            xAxisKey="name"
            title={t('mobileAnalytics.topScreens')}
            color="#15803d"
            height={280}
          />
        )}
      </div>

      <div className="charts-grid">
        {lineData.length > 0 && (
          <Chart
            type="line"
            data={lineData}
            dataKeys={[
              { dataKey: 'auctions', name: t('analytics.auctions'), color: '#16a34a' },
              { dataKey: 'tenders', name: t('analytics.tenders'), color: '#22c55e' },
              { dataKey: 'orders', name: t('common.orders'), color: '#15803d' },
            ]}
            xAxisKey="date"
            title={t('mobileAnalytics.kpiTrend')}
            height={320}
          />
        )}
        {barData.length > 0 && (
          <Chart
            type="bar"
            data={barData}
            dataKey="value"
            xAxisKey="label"
            title={t('mobileAnalytics.rangeTotals')}
            color="#16a34a"
            height={320}
          />
        )}
      </div>

      <div className="card heatmap-card">
        <h3 className="chart-title">{t('mobileAnalytics.heatmapTitle')}</h3>
        {heatmapData.length === 0 ? (
          <p className="empty-text">{t('mobileAnalytics.noHeatmapData')}</p>
        ) : (
          <div className="heatmap-grid">
            {heatmapData.map((point, index) => (
              <div
                key={`${point.date}-${index}`}
                className={`heatmap-cell heatmap-${point.intensity || 'low'}`}
                title={`${point.date}: ${point.value}`}
              >
                <span>{new Date(point.date).getDate()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">{t('mobileAnalytics.loggerTrace')}</h2>
        </div>
        {loggerUnavailable && (
          <div className="error-message card">
            <p>⚠️ {loggerUnavailable}</p>
          </div>
        )}
        {loggerRows.length > 0 ? (
          <>
            <Table columns={loggerColumns} data={loggerRows} />
            <div className="pagination-info">
              <span>
                {t('mobileAnalytics.pagination', {
                  page: pagination.page,
                  totalPages: pagination.totalPages,
                  total: pagination.total,
                })}
              </span>
              <div className="pagination-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                >
                  {t('common.previous')}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={filters.page >= pagination.totalPages}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.min(pagination.totalPages || prev.page + 1, prev.page + 1),
                    }))
                  }
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="card">
            <p className="empty-text">{t('mobileAnalytics.noLoggerRows')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileAnalytics
