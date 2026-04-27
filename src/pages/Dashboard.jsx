import React, { useState, useEffect } from 'react'
import { FiUsers, FiDollarSign, FiShoppingCart, FiTrendingUp, FiRefreshCw, FiPackage, FiActivity, FiGlobe, FiAlertCircle, FiClock } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import AdminPushNotifications from '../components/AdminPushNotifications/AdminPushNotifications'
import { useTranslation } from '../hooks/useTranslation'
import Chart from '../components/Chart/Chart'
import Table from '../components/Table/Table'
import { useAutoFillData, useRealTimeData, useMapData } from '../hooks/useDashboardData'
import { useNotifications } from '../contexts/NotificationContext'
import authService from '../services/authService'
import analyticsService from '../services/analyticsService'
import marketAnalysisService from '../services/marketAnalysisService'
import './Dashboard.css'

const Dashboard = () => {
  const { t } = useTranslation()
  const [selectedDays, setSelectedDays] = useState(30)
  const [lineChartData, setLineChartData] = useState([])
  const [barChartData, setBarChartData] = useState([])
  const [heatmapData, setHeatmapData] = useState([])
  const [analyticsWidgetsLoading, setAnalyticsWidgetsLoading] = useState(false)
  const [analyticsWidgetsError, setAnalyticsWidgetsError] = useState('')
  const { registerDevice, fcmToken, permission, isInitialized } = useNotifications()
  
  // Register device when dashboard loads
  useEffect(() => {
    const registerDeviceOnLoad = async () => {
      try {
        // Wait for notifications to be initialized
        if (!isInitialized) {
          return;
        }

        // Get userId from auth service or localStorage
        let userId = authService.getUserId();
        
        // If userId not found, try to get from API
        if (!userId && authService.isAuthenticated()) {
          try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser?.userId || currentUser?.data?.userId || currentUser?.data?.id) {
              userId = currentUser?.userId || currentUser?.data?.userId || currentUser?.data?.id;
              if (userId) {
                localStorage.setItem('userId', userId.toString());
                console.log('User ID stored from API:', userId);
              }
            }
          } catch (error) {
            console.warn('Could not get current user:', error);
          }
        }

        // Register device if we have userId and permission is granted
        if (userId && permission === 'granted') {
          // Check if FCM token is available (required for registration)
          if (!fcmToken) {
            console.log('Waiting for FCM token...');
            return;
          }

          // Check if device is already registered (avoid duplicate registrations)
          const lastRegistration = localStorage.getItem('deviceRegistrationTime');
          const lastRegistrationTime = lastRegistration ? parseInt(lastRegistration, 10) : 0;
          const now = Date.now();
          const registrationCooldown = 5 * 60 * 1000; // 5 minutes cooldown

          // Only register if not recently registered
          if (now - lastRegistrationTime > registrationCooldown) {
            try {
              await registerDevice(userId);
              localStorage.setItem('deviceRegistrationTime', now.toString());
              console.log('Device registered successfully on dashboard load');
            } catch (error) {
              console.error('Failed to register device on dashboard load:', error);
            }
          } else {
            console.log('Device registration skipped (recently registered)');
          }
        } else if (userId && permission === 'default') {
          // If permission is not granted yet, don't request automatically
          // Let user decide to enable notifications through the UI
          console.log('Notification permission not granted. User can enable notifications from the notification bell icon.');
        } else if (!userId) {
          console.warn('User ID not found. Device will not be registered. User may need to log in.');
        }
      } catch (error) {
        console.error('Error in device registration on dashboard load:', error);
      }
    };

    // Register device after a short delay to ensure notifications are initialized
    const timeoutId = setTimeout(() => {
      registerDeviceOnLoad();
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [registerDevice, fcmToken, permission, isInitialized])
  
  // Fetch comprehensive dashboard data
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useAutoFillData({ days: selectedDays })
  
  // Fetch real-time data
  const { data: realTimeData, loading: realTimeLoading } = useRealTimeData()
  
  // Fetch map data for governorate table
  const { data: mapData, loading: mapLoading } = useMapData()

  const handleRefresh = () => {
    window.location.reload()
  }

  const getRangeByDays = (days) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    return { from: from.toISOString(), to: to.toISOString() }
  }

  const normalizeLineChart = (response) => {
    const payload = response?.data || response || {}
    const series = payload.series || {}
    const byDate = new Map()

    ;['auctions', 'tenders', 'orders'].forEach((key) => {
      const arr = Array.isArray(series[key]) ? series[key] : []
      arr.forEach((item) => {
        const date = item.date
        if (!date) return
        if (!byDate.has(date)) byDate.set(date, { date, auctions: 0, tenders: 0, orders: 0 })
        byDate.get(date)[key] = item.value || 0
      })
    })

    return Array.from(byDate.values()).sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const normalizeBarChart = (response) => {
    const payload = response?.data || response || {}
    const bars = Array.isArray(payload.bars) ? payload.bars : []
    return bars.map((item) => ({ label: item.label || '-', value: item.value || 0 }))
  }

  const normalizeHeatmap = (response) => {
    const payload = response?.data || response || {}
    const points = Array.isArray(payload.data) ? payload.data : []
    return points
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => ({
        date: item.date,
        value: item.value || 0,
        intensity: item.intensity || 'low',
      }))
  }

  useEffect(() => {
    const loadAnalyticsWidgets = async () => {
      try {
        setAnalyticsWidgetsLoading(true)
        setAnalyticsWidgetsError('')
        const range = getRangeByDays(selectedDays)
        const currentYear = new Date().getFullYear()

        const [lineRes, barRes, heatmapRes] = await Promise.allSettled([
          analyticsService.getLineChart({ from: range.from, to: range.to, allTime: false }),
          analyticsService.getBarChart({ from: range.from, to: range.to, allTime: false }),
          marketAnalysisService.getSalesHeatmap({ year: currentYear }),
        ])

        if (lineRes.status === 'fulfilled') {
          setLineChartData(normalizeLineChart(lineRes.value))
        } else {
          setLineChartData([])
        }

        if (barRes.status === 'fulfilled') {
          setBarChartData(normalizeBarChart(barRes.value))
        } else {
          setBarChartData([])
        }

        if (heatmapRes.status === 'fulfilled') {
          setHeatmapData(normalizeHeatmap(heatmapRes.value))
        } else {
          setHeatmapData([])
        }

        if (
          lineRes.status === 'rejected' &&
          barRes.status === 'rejected' &&
          heatmapRes.status === 'rejected'
        ) {
          setAnalyticsWidgetsError('Failed to load analytics widgets.')
        }
      } catch (error) {
        setAnalyticsWidgetsError(error.message || 'Failed to load analytics widgets.')
      } finally {
        setAnalyticsWidgetsLoading(false)
      }
    }

    loadAnalyticsWidgets()
  }, [selectedDays])

  // Format revenue sparkline data for chart
  const formatRevenueData = (data) => {
    if (!data || !data.data || !data.data.marketAnalysis || !data.data.marketAnalysis.revenueSparkline) return []
    return data.data.marketAnalysis.revenueSparkline.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.value || 0
    }))
  }

  // Format price trends data for chart
  const formatPriceTrendsData = (data) => {
    if (!data || !data.data || !data.data.priceTrends) return []
    return data.data.priceTrends.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: item.avgPrice || 0
    }))
  }

  // Format top products data for chart
  const formatTopProductsData = (data) => {
    if (!data || !data.data || !data.data.topProducts) return []
    return data.data.topProducts.slice(0, 5).map(item => ({
      name: item.nameAr || item.nameEn || `Product ${item.productId}`,
      revenue: item.totalRevenue || 0
    }))
  }

  // Format market share data for chart
  const formatMarketShareData = (data) => {
    if (!data || !data.data || !data.data.transactionsByType) return []
    return data.data.transactionsByType.map(item => ({
      name: item.type === 'direct' ? t('dashboard.directSales') : item.type === 'auction' ? t('dashboard.auctions') : t('dashboard.tenders'),
      value: item.count || 0,
      revenue: item.value || 0
    }))
  }

  // Format governorate data for table
  const formatGovernorateData = (data) => {
    if (!data || !data.data) return []
    const apiData = data.data
    
    if (Array.isArray(apiData)) {
      return apiData.map(item => ({
        governorate: item.governorate || t('dashboard.unknown'),
        offeredQty: item.offeredQty || 0,
        soldQty: item.soldQty || 0,
        avgPrices: item.avgPrices && item.avgPrices.length > 0 
          ? item.avgPrices.map(p => `${p.product}: ${p.price}`).join(', ')
          : 'N/A'
      }))
    }
    return []
  }

  // Format recent activity data for table
  const formatRecentActivity = (data) => {
    if (!data || !data.data || !data.data.recentActivity) return []
    const activity = data.data.recentActivity
    const allItems = []
    
    if (activity.auctions) {
      activity.auctions.slice(0, 5).forEach(item => {
        allItems.push({
          type: t('dashboard.auctions'),
          id: `#${item.id}`,
          title: item.title,
          status: item.status,
          createdAt: new Date(item.createdAt).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        })
      })
    }
    
    if (activity.tenders) {
      activity.tenders.slice(0, 5).forEach(item => {
        allItems.push({
          type: t('dashboard.tenders'),
          id: `#${item.id}`,
          title: item.title,
          status: item.status,
          createdAt: new Date(item.createdAt).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        })
      })
    }
    
    return allItems.slice(0, 10)
  }

  // Table columns for governorate data
  const governorateColumns = [
    { header: t('dashboard.governorate'), accessor: 'governorate' },
    { 
      header: t('dashboard.offeredQty'), 
      accessor: 'offeredQty',
      render: (value) => <strong>{value.toLocaleString()}</strong>
    },
    { 
      header: t('dashboard.soldQty'), 
      accessor: 'soldQty',
      render: (value) => <span className={value > 0 ? 'text-success' : ''}>{value.toLocaleString()}</span>
    },
    { 
      header: t('dashboard.avgPrices'), 
      accessor: 'avgPrices',
      render: (value) => <span className="text-small">{value}</span>
    },
  ]

  // Table columns for recent activity
  const activityColumns = [
    { 
      header: t('dashboard.type'), 
      accessor: 'type',
      render: (value) => {
        const badgeClass = value === t('dashboard.auctions') ? 'badge-primary' : 'badge-warning'
        return <span className={`badge ${badgeClass}`}>{value}</span>
      }
    },
    { header: 'ID', accessor: 'id' },
    { header: t('dashboard.columnTitle'), accessor: 'title' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => {
        const statusClass = value === 'open' ? 'badge-success' : 
                          value === 'closed' ? 'badge-danger' : 'badge-warning'
        return <span className={`badge ${statusClass}`}>{value}</span>
      }
    },
    { header: t('dashboard.createdAt'), accessor: 'createdAt' },
  ]

  const revenueData = formatRevenueData(dashboardData)
  const priceTrendsData = formatPriceTrendsData(dashboardData)
  const topProductsData = formatTopProductsData(dashboardData)
  const marketShareData = formatMarketShareData(dashboardData)
  const governorateTableData = formatGovernorateData(mapData)
  const activityTableData = formatRecentActivity(dashboardData)

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.governmentDashboard')}</h1>
          <p className="page-subtitle">{t('dashboard.realtimeOverview')}</p>
        </div>
        <div className="header-actions">
          <select 
            className="filter-select" 
            value={selectedDays} 
            onChange={(e) => setSelectedDays(Number(e.target.value))}
          >
            <option value={7}>{t('dashboard.last7Days')}</option>
            <option value={30}>{t('dashboard.last30Days')}</option>
            <option value={60}>{t('dashboard.last60Days')}</option>
            <option value={90}>{t('dashboard.last90Days')}</option>
          </select>
          <button className="btn btn-outline" onClick={handleRefresh}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {dashboardError && (
        <div className="error-message card">
          <p>⚠️ {dashboardError}</p>
          <p className="error-note">Unable to fetch dashboard data. Please check your connection.</p>
        </div>
      )}

      {/* Admin Push Notifications - send/schedule notifications to users */}
      <AdminPushNotifications />

      {dashboardLoading ? (
        <div className="loading-message card">
          <p>⏳ {t('dashboard.loadingData')}</p>
        </div>
      ) : dashboardData?.data && (
        <>
          {/* Main KPI Cards */}
          <div className="stats-grid">
            <StatCard
              title="Total Revenue"
              value={`$${(dashboardData.data.marketAnalysis?.totalRevenue?.value || 0).toLocaleString()}`}
              change={dashboardData.data.marketAnalysis?.totalRevenue?.changePercentage}
              icon={<FiDollarSign />}
              color="success"
            />
            <StatCard
              title={t('dashboard.totalTransactions')}
              value={(dashboardData.data.marketAnalysis?.totalTransactions?.value || 0).toLocaleString()}
              change={dashboardData.data.marketAnalysis?.totalTransactions?.changePercentage}
              icon={<FiShoppingCart />}
              color="primary"
            />
            <StatCard
              title="Total Volume"
              value={`${(dashboardData.data.marketAnalysis?.totalVolume?.value || 0).toLocaleString()} kg`}
              change={dashboardData.data.marketAnalysis?.totalVolume?.changePercentage}
              icon={<FiPackage />}
              color="warning"
            />
            <StatCard
              title={t('dashboard.averagePrice')}
              value={`$${(dashboardData.data.marketAnalysis?.averagePrice?.value || 0).toLocaleString()}/kg`}
              change={dashboardData.data.marketAnalysis?.averagePrice?.changePercentage}
              icon={<FiTrendingUp />}
              color="danger"
            />
          </div>

          {/* Overview Statistics */}
          {dashboardData.data.overview && (
            <div className="overview-grid">
              <div className="overview-card card">
                <div className="overview-icon">
                  <FiUsers color="#6366f1" size={24} />
                </div>
                <div className="overview-content">
                  <span className="overview-label">{t('dashboard.totalUsers')}</span>
                  <span className="overview-value">{dashboardData.data.overview.totalUsers.toLocaleString()}</span>
                  <span className="overview-detail">{t('dashboard.active30d')}: {dashboardData.data.overview.activeUsers30Days}</span>
                </div>
              </div>
              <div className="overview-card card">
                <div className="overview-icon">
                  <FiGlobe color="#10b981" size={24} />
                </div>
                <div className="overview-content">
                  <span className="overview-label">{t('dashboard.totalFarms')}</span>
                  <span className="overview-value">{dashboardData.data.overview.totalFarms.toLocaleString()}</span>
                  <span className="overview-detail">Inventory: {dashboardData.data.overview.totalInventory.toLocaleString()} kg</span>
                </div>
              </div>
              <div className="overview-card card">
                <div className="overview-icon">
                  <FiActivity color="#f59e0b" size={24} />
                </div>
                <div className="overview-content">
                  <span className="overview-label">{t('dashboard.openAuctions')}</span>
                  <span className="overview-value">{dashboardData.data.overview.openAuctions.toLocaleString()}</span>
                  <span className="overview-detail">Tenders: {dashboardData.data.overview.openTenders}</span>
                </div>
              </div>
              <div className="overview-card card">
                <div className="overview-icon">
                  <FiPackage color="#ef4444" size={24} />
                </div>
                <div className="overview-content">
                  <span className="overview-label">{t('dashboard.activeListings')}</span>
                  <span className="overview-value">{dashboardData.data.overview.activeListings.toLocaleString()}</span>
                  <span className="overview-detail">New today: {dashboardData.data.overview.newUsersToday}</span>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Activity */}
          {realTimeData?.data && (
            <div className="realtime-section card">
              <div className="realtime-header">
                <h3><FiClock /> {t('dashboard.todaysActivity')}</h3>
                {!realTimeLoading && (
                  <span className="realtime-timestamp">
                    Last updated: {new Date(realTimeData.data.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="realtime-stats">
                <div className="realtime-stat">
                  <span className="realtime-label">{t('dashboard.newUsers')}</span>
                  <span className="realtime-value">{realTimeData.data.todayStats.newUsers}</span>
                </div>
                <div className="realtime-stat">
                  <span className="realtime-label">New Auctions</span>
                  <span className="realtime-value">{realTimeData.data.todayStats.newAuctions}</span>
                </div>
                <div className="realtime-stat">
                  <span className="realtime-label">{t('dashboard.newTenders')}</span>
                  <span className="realtime-value">{realTimeData.data.todayStats.newTenders}</span>
                </div>
                <div className="realtime-stat">
                  <span className="realtime-label">Total Bids</span>
                  <span className="realtime-value">{realTimeData.data.todayStats.totalBids}</span>
                </div>
                <div className="realtime-stat">
                  <span className="realtime-label">{t('dashboard.totalOffers')}</span>
                  <span className="realtime-value">{realTimeData.data.todayStats.totalOffers}</span>
                </div>
              </div>
            </div>
          )}

          {/* Charts Section */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Core Analytics</h2>
            </div>
            {analyticsWidgetsLoading && (
              <div className="loading-message card">
                <p>Loading analytics widgets...</p>
              </div>
            )}
            {analyticsWidgetsError && (
              <div className="error-message card">
                <p>⚠️ {analyticsWidgetsError}</p>
              </div>
            )}
            <div className="charts-grid">
              {lineChartData.length > 0 && (
                <Chart
                  type="line"
                  data={lineChartData}
                  dataKeys={[
                    { dataKey: 'auctions', name: 'Auctions', color: '#6366f1' },
                    { dataKey: 'tenders', name: 'Tenders', color: '#10b981' },
                    { dataKey: 'orders', name: 'Orders', color: '#f59e0b' },
                  ]}
                  xAxisKey="date"
                  title="Auctions, Tenders, Orders (Daily)"
                  height={320}
                />
              )}
              {barChartData.length > 0 && (
                <Chart
                  type="bar"
                  data={barChartData}
                  dataKey="value"
                  xAxisKey="label"
                  title="Totals in Selected Range"
                  color="#8b5cf6"
                  height={320}
                />
              )}
            </div>
            {heatmapData.length > 0 && (
              <div className="heatmap-card card">
                <h3 className="chart-title">Sales Heatmap (Day Intensity)</h3>
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
              </div>
            )}
          </div>

          <div className="charts-grid">
            {revenueData.length > 0 && (
              <Chart
                type="area"
                data={revenueData}
                dataKey="value"
                xAxisKey="date"
                title={t('dashboard.revenueTrends')}
                color="#6366f1"
              />
            )}
            {priceTrendsData.length > 0 && (
              <Chart
                type="line"
                data={priceTrendsData}
                dataKey="price"
                xAxisKey="date"
                title={t('dashboard.priceTrends')}
                color="#10b981"
              />
            )}
          </div>

          <div className="charts-grid">
            {topProductsData.length > 0 && (
              <Chart
                type="bar"
                data={topProductsData}
                dataKey="revenue"
                xAxisKey="name"
                title="Top 5 Products by Revenue"
                color="#f59e0b"
              />
            )}
            {marketShareData.length > 0 && (
              <Chart
                type="bar"
                data={marketShareData}
                dataKey="value"
                xAxisKey="name"
                title={t('dashboard.transactionsByType')}
                color="#ef4444"
              />
            )}
          </div>

          {/* Recent Activity Table */}
          {activityTableData.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Recent Activity</h2>
              </div>
              <Table columns={activityColumns} data={activityTableData} />
            </div>
          )}

          {/* Governorate Data Table */}
          {governorateTableData.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">{t('dashboard.activityByGovernorate')}</h2>
                <div className="section-actions">
                  {mapLoading && <span className="loading-text">{t('common.loading')}</span>}
                </div>
              </div>
              <Table columns={governorateColumns} data={governorateTableData} />
            </div>
          )}

          {/* Low Stock Alert */}
          {dashboardData.data.inventory && dashboardData.data.inventory.lowStockProducts && dashboardData.data.inventory.lowStockProducts.length > 0 && (
            <div className="low-stock-section card">
              <div className="low-stock-header">
                <h3><FiAlertCircle /> {t('dashboard.lowStockProducts')}</h3>
                <span className="low-stock-count">{dashboardData.data.inventory.lowStockProducts.length} items</span>
              </div>
              <div className="low-stock-list">
                {dashboardData.data.inventory.lowStockProducts.slice(0, 5).map((product, index) => (
                  <div className="low-stock-item" key={index}>
                    <span className="product-name">{product.productName || `Product ${product.productId}`}</span>
                    <span className="stock-qty">{product.quantityOnHand} kg ({product.cropsCount} crops)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
