import React, { useState } from 'react'
import { FiUsers, FiDollarSign, FiShoppingCart, FiTrendingUp, FiRefreshCw, FiPackage, FiActivity, FiGlobe, FiAlertCircle, FiClock } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import Chart from '../components/Chart/Chart'
import Table from '../components/Table/Table'
import { useAutoFillData, useRealTimeData, useMapData } from '../hooks/useDashboardData'
import './Dashboard.css'

const Dashboard = () => {
  const [selectedDays, setSelectedDays] = useState(30)
  
  // Fetch comprehensive dashboard data
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useAutoFillData({ days: selectedDays })
  
  // Fetch real-time data
  const { data: realTimeData, loading: realTimeLoading } = useRealTimeData()
  
  // Fetch map data for governorate table
  const { data: mapData, loading: mapLoading } = useMapData()

  const handleRefresh = () => {
    window.location.reload()
  }

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
      name: item.type === 'direct' ? 'Direct Sales' : item.type === 'auction' ? 'Auctions' : 'Tenders',
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
        governorate: item.governorate || 'Unknown',
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
          type: 'Auction',
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
          type: 'Tender',
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
    { header: 'Governorate', accessor: 'governorate' },
    { 
      header: 'Offered Qty (kg)', 
      accessor: 'offeredQty',
      render: (value) => <strong>{value.toLocaleString()}</strong>
    },
    { 
      header: 'Sold Qty (kg)', 
      accessor: 'soldQty',
      render: (value) => <span className={value > 0 ? 'text-success' : ''}>{value.toLocaleString()}</span>
    },
    { 
      header: 'Avg Prices', 
      accessor: 'avgPrices',
      render: (value) => <span className="text-small">{value}</span>
    },
  ]

  // Table columns for recent activity
  const activityColumns = [
    { 
      header: 'Type', 
      accessor: 'type',
      render: (value) => {
        const badgeClass = value === 'Auction' ? 'badge-primary' : 'badge-warning'
        return <span className={`badge ${badgeClass}`}>{value}</span>
      }
    },
    { header: 'ID', accessor: 'id' },
    { header: 'Title', accessor: 'title' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => {
        const statusClass = value === 'open' ? 'badge-success' : 
                          value === 'closed' ? 'badge-danger' : 'badge-warning'
        return <span className={`badge ${statusClass}`}>{value}</span>
      }
    },
    { header: 'Created At', accessor: 'createdAt' },
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
          <h1 className="page-title">Government Dashboard</h1>
          <p className="page-subtitle">Real-time market overview and analytics</p>
        </div>
        <div className="header-actions">
          <select 
            className="filter-select" 
            value={selectedDays} 
            onChange={(e) => setSelectedDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={60}>Last 60 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button className="btn btn-outline" onClick={handleRefresh}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {dashboardError && (
        <div className="error-message card">
          <p>⚠️ {dashboardError}</p>
          <p className="error-note">Unable to fetch dashboard data. Please check your connection.</p>
        </div>
      )}

      {dashboardLoading ? (
        <div className="loading-message card">
          <p>⏳ Loading dashboard data...</p>
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
              title="Total Transactions"
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
              title="Average Price"
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
                  <span className="overview-label">Total Users</span>
                  <span className="overview-value">{dashboardData.data.overview.totalUsers.toLocaleString()}</span>
                  <span className="overview-detail">Active (30d): {dashboardData.data.overview.activeUsers30Days}</span>
                </div>
              </div>
              <div className="overview-card card">
                <div className="overview-icon">
                  <FiGlobe color="#10b981" size={24} />
                </div>
                <div className="overview-content">
                  <span className="overview-label">Total Farms</span>
                  <span className="overview-value">{dashboardData.data.overview.totalFarms.toLocaleString()}</span>
                  <span className="overview-detail">Inventory: {dashboardData.data.overview.totalInventory.toLocaleString()} kg</span>
                </div>
              </div>
              <div className="overview-card card">
                <div className="overview-icon">
                  <FiActivity color="#f59e0b" size={24} />
                </div>
                <div className="overview-content">
                  <span className="overview-label">Open Auctions</span>
                  <span className="overview-value">{dashboardData.data.overview.openAuctions.toLocaleString()}</span>
                  <span className="overview-detail">Tenders: {dashboardData.data.overview.openTenders}</span>
                </div>
              </div>
              <div className="overview-card card">
                <div className="overview-icon">
                  <FiPackage color="#ef4444" size={24} />
                </div>
                <div className="overview-content">
                  <span className="overview-label">Active Listings</span>
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
                <h3><FiClock /> Today's Activity</h3>
                {!realTimeLoading && (
                  <span className="realtime-timestamp">
                    Last updated: {new Date(realTimeData.data.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="realtime-stats">
                <div className="realtime-stat">
                  <span className="realtime-label">New Users</span>
                  <span className="realtime-value">{realTimeData.data.todayStats.newUsers}</span>
                </div>
                <div className="realtime-stat">
                  <span className="realtime-label">New Auctions</span>
                  <span className="realtime-value">{realTimeData.data.todayStats.newAuctions}</span>
                </div>
                <div className="realtime-stat">
                  <span className="realtime-label">New Tenders</span>
                  <span className="realtime-value">{realTimeData.data.todayStats.newTenders}</span>
                </div>
                <div className="realtime-stat">
                  <span className="realtime-label">Total Bids</span>
                  <span className="realtime-value">{realTimeData.data.todayStats.totalBids}</span>
                </div>
                <div className="realtime-stat">
                  <span className="realtime-label">Total Offers</span>
                  <span className="realtime-value">{realTimeData.data.todayStats.totalOffers}</span>
                </div>
              </div>
            </div>
          )}

          {/* Charts Section */}
          <div className="charts-grid">
            {revenueData.length > 0 && (
              <Chart
                type="area"
                data={revenueData}
                dataKey="value"
                xAxisKey="date"
                title="Revenue Trends"
                color="#6366f1"
              />
            )}
            {priceTrendsData.length > 0 && (
              <Chart
                type="line"
                data={priceTrendsData}
                dataKey="price"
                xAxisKey="date"
                title="Average Price Trends"
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
                title="Transactions by Type"
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
                <h2 className="section-title">Activity by Governorate</h2>
                <div className="section-actions">
                  {mapLoading && <span className="loading-text">Loading...</span>}
                </div>
              </div>
              <Table columns={governorateColumns} data={governorateTableData} />
            </div>
          )}

          {/* Low Stock Alert */}
          {dashboardData.data.inventory && dashboardData.data.inventory.lowStockProducts && dashboardData.data.inventory.lowStockProducts.length > 0 && (
            <div className="low-stock-section card">
              <div className="low-stock-header">
                <h3><FiAlertCircle /> Low Stock Products</h3>
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
