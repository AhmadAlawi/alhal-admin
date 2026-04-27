import React, { useEffect, useMemo, useState } from 'react'
import { FiFilter, FiRefreshCw, FiSmartphone } from 'react-icons/fi'
import Chart from '../components/Chart/Chart'
import Table from '../components/Table/Table'
import analyticsService from '../services/analyticsService'
import marketAnalysisService from '../services/marketAnalysisService'
import './MobileAnalytics.css'

const MobileAnalytics = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lineData, setLineData] = useState([])
  const [barData, setBarData] = useState([])
  const [heatmapData, setHeatmapData] = useState([])
  const [loggerRows, setLoggerRows] = useState([])
  const [loggerUnavailable, setLoggerUnavailable] = useState('')

  const [filters, setFilters] = useState({
    allTime: false,
    from: '',
    to: '',
    productId: '',
    governorate: '',
    year: new Date().getFullYear(),
    eventType: '',
    screen: '',
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
    return Array.from(byDate.values()).sort((a, b) => new Date(a.date) - new Date(b.date))
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
    return rows.map((row) => ({
      at: row.clientTimestamp || row.timestamp || row.createdAt || '-',
      type: row.eventType || row.type || '-',
      level: row.eventLevel || row.level || '-',
      screen: row.screen || '-',
      message: row.message || '-',
      userId: row.userId ?? '-',
      sessionId: row.sessionId || '-',
    }))
  }

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      setLoggerUnavailable('')

      const [lineRes, barRes, heatRes, loggerRes] = await Promise.allSettled([
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
        analyticsService.getEventsQuery({
          from: filters.from,
          to: filters.to,
          type: filters.eventType || undefined,
          screen: filters.screen || undefined,
          page: 1,
          pageSize: 100,
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
          loggerRes.reason?.message ||
            'Logger query endpoint is unavailable. Add /api/analytics/events/query on backend.'
        )
      }

      if (
        lineRes.status === 'rejected' &&
        barRes.status === 'rejected' &&
        heatRes.status === 'rejected'
      ) {
        setError('Failed to load mobile analytics data.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load mobile analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loggerColumns = useMemo(
    () => [
      {
        header: 'Time',
        accessor: 'at',
        render: (value) => (value && value !== '-' ? new Date(value).toLocaleString() : '-'),
      },
      { header: 'Type', accessor: 'type' },
      { header: 'Level', accessor: 'level' },
      { header: 'Screen', accessor: 'screen' },
      { header: 'Message', accessor: 'message' },
      { header: 'User', accessor: 'userId' },
      { header: 'Session', accessor: 'sessionId' },
    ],
    []
  )

  return (
    <div className="mobile-analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiSmartphone /> Mobile Analytics
          </h1>
          <p className="page-subtitle">Full analytics + logger trace with filters and heatmap</p>
        </div>
        <button className="btn btn-outline" onClick={load}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="card mobile-filters">
        <h3>
          <FiFilter /> Filters
        </h3>
        <div className="filters-grid">
          <label>
            All Time
            <input
              type="checkbox"
              checked={filters.allTime}
              onChange={(e) => setFilters((prev) => ({ ...prev, allTime: e.target.checked }))}
            />
          </label>
          <label>
            From
            <input
              type="datetime-local"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
              disabled={filters.allTime}
            />
          </label>
          <label>
            To
            <input
              type="datetime-local"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
              disabled={filters.allTime}
            />
          </label>
          <label>
            Heatmap Year
            <input
              type="number"
              min="2020"
              max="2100"
              value={filters.year}
              onChange={(e) => setFilters((prev) => ({ ...prev, year: Number(e.target.value) }))}
            />
          </label>
          <label>
            Product ID
            <input
              type="number"
              value={filters.productId}
              onChange={(e) => setFilters((prev) => ({ ...prev, productId: e.target.value }))}
            />
          </label>
          <label>
            Governorate
            <input
              type="text"
              value={filters.governorate}
              onChange={(e) => setFilters((prev) => ({ ...prev, governorate: e.target.value }))}
            />
          </label>
          <label>
            Event Type
            <input
              type="text"
              placeholder="screen_view, api_error..."
              value={filters.eventType}
              onChange={(e) => setFilters((prev) => ({ ...prev, eventType: e.target.value }))}
            />
          </label>
          <label>
            Screen
            <input
              type="text"
              placeholder="Dashboard/Home"
              value={filters.screen}
              onChange={(e) => setFilters((prev) => ({ ...prev, screen: e.target.value }))}
            />
          </label>
        </div>
        <div className="filters-actions">
          <button className="btn btn-primary" onClick={load}>
            Apply Filters
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-message card">
          <p>Loading mobile analytics...</p>
        </div>
      )}
      {error && (
        <div className="error-message card">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="charts-grid">
        {lineData.length > 0 && (
          <Chart
            type="line"
            data={lineData}
            dataKeys={[
              { dataKey: 'auctions', name: 'Auctions', color: '#16a34a' },
              { dataKey: 'tenders', name: 'Tenders', color: '#22c55e' },
              { dataKey: 'orders', name: 'Orders', color: '#15803d' },
            ]}
            xAxisKey="date"
            title="Mobile KPI Daily Trend"
            height={320}
          />
        )}
        {barData.length > 0 && (
          <Chart
            type="bar"
            data={barData}
            dataKey="value"
            xAxisKey="label"
            title="Range Totals"
            color="#16a34a"
            height={320}
          />
        )}
      </div>

      <div className="card heatmap-card">
        <h3 className="chart-title">Sales Heatmap</h3>
        {heatmapData.length === 0 ? (
          <p className="empty-text">No heatmap data for selected filters.</p>
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
          <h2 className="section-title">Mobile Logger Trace</h2>
        </div>
        {loggerUnavailable && (
          <div className="error-message card">
            <p>⚠️ {loggerUnavailable}</p>
          </div>
        )}
        {loggerRows.length > 0 ? (
          <Table columns={loggerColumns} data={loggerRows} />
        ) : (
          <div className="card">
            <p className="empty-text">No logger rows returned for current filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileAnalytics
