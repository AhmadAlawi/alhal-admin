import React, { useState, useEffect } from 'react'
import { FiFilter, FiRefreshCw, FiDownload, FiTrendingUp, FiBarChart2, FiPieChart, FiActivity, FiDatabase, FiUsers, FiPackage, FiTruck, FiFileText, FiGavel, FiDollarSign, FiBox, FiZap, FiTrendingDown, FiShoppingCart, FiMapPin } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import Chart from '../components/Chart/Chart'
import Table from '../components/Table/Table'
import reportsService from '../services/reportsService'
import adminService from '../services/adminService'
import { useTranslation } from '../hooks/useTranslation'
import './Reports.css'

const Reports = () => {
  const { t } = useTranslation()
  
  // Report categories
  const reportCategories = [
    { id: 'sales', name: 'Sales Reports', icon: <FiShoppingCart />, count: 5 },
    { id: 'users', name: 'User Reports', icon: <FiUsers />, count: 5 },
    { id: 'products', name: 'Product Reports', icon: <FiPackage />, count: 5 },
    { id: 'transport', name: 'Transport Reports', icon: <FiTruck />, count: 5 },
    { id: 'tenders', name: 'Tender Reports', icon: <FiFileText />, count: 4 },
    { id: 'auctions', name: 'Auction Reports', icon: <FiGavel />, count: 3 },
    { id: 'financial', name: 'Financial Reports', icon: <FiDollarSign />, count: 4 },
    { id: 'inventory', name: 'Inventory Reports', icon: <FiBox />, count: 4 },
    { id: 'performance', name: 'Performance Reports', icon: <FiZap />, count: 3 },
    { id: 'market', name: 'Market Analysis Reports', icon: <FiBarChart2 />, count: 3 },
    { id: 'losses', name: 'Loss Reports', icon: <FiTrendingDown />, count: 3 },
  ]

  // Report definitions
  const reportDefinitions = {
    sales: [
      { id: 'sales', name: 'Sales Report', endpoint: 'getSalesReport', description: 'Comprehensive sales overview' },
      { id: 'sales-by-product', name: 'Sales by Product', endpoint: 'getSalesByProduct', description: 'Sales performance by product' },
      { id: 'sales-by-category', name: 'Sales by Category', endpoint: 'getSalesByCategory', description: 'Sales distribution by category' },
      { id: 'sales-by-location', name: 'Sales by Location', endpoint: 'getSalesByLocation', description: 'Sales performance by location' },
      { id: 'sales-trends', name: 'Sales Trends', endpoint: 'getSalesTrends', description: 'Sales trends over time' },
    ],
    users: [
      { id: 'user-activity', name: 'User Activity', endpoint: 'getUserActivity', description: 'New and active users over time' },
      { id: 'user-registrations', name: 'User Registrations', endpoint: 'getUserRegistrations', description: 'Registration trends and verification' },
      { id: 'user-type', name: 'User Type Distribution', endpoint: 'getUserTypeDistribution', description: 'Distribution by user type' },
      { id: 'user-location', name: 'User Location', endpoint: 'getUserLocation', description: 'User distribution by location' },
      { id: 'user-performance', name: 'User Performance', endpoint: 'getUserPerformance', description: 'Individual user performance metrics' },
    ],
    products: [
      { id: 'product-performance', name: 'Product Performance', endpoint: 'getProductPerformance', description: 'Sales performance metrics per product' },
      { id: 'product-inventory', name: 'Product Inventory', endpoint: 'getProductInventory', description: 'Current inventory levels' },
      { id: 'product-price-trends', name: 'Product Price Trends', endpoint: 'getProductPriceTrends', description: 'Price trends over time' },
      { id: 'top-products', name: 'Top Products', endpoint: 'getTopProducts', description: 'Top performing products' },
      { id: 'product-category', name: 'Product Category', endpoint: 'getProductCategory', description: 'Product distribution by category' },
    ],
    transport: [
      { id: 'transport-activity', name: 'Transport Activity', endpoint: 'getTransportActivity', description: 'Transport request activity' },
      { id: 'transport-providers', name: 'Transport Providers', endpoint: 'getTransportProviders', description: 'All transport providers' },
      { id: 'transport-routes', name: 'Transport Routes', endpoint: 'getTransportRoutes', description: 'Available transport routes' },
      { id: 'transport-revenue', name: 'Transport Revenue', endpoint: 'getTransportRevenue', description: 'Revenue from transport services' },
      { id: 'transport-ratings', name: 'Transport Ratings', endpoint: 'getTransportRatings', description: 'Ratings and reviews' },
    ],
    tenders: [
      { id: 'tender-activity', name: 'Tender Activity', endpoint: 'getTenderActivity', description: 'Tender creation and status' },
      { id: 'tender-performance', name: 'Tender Performance', endpoint: 'getTenderPerformance', description: 'Performance metrics' },
      { id: 'tender-offers', name: 'Tender Offers', endpoint: 'getTenderOffers', description: 'Offer statistics' },
      { id: 'tender-awards', name: 'Tender Awards', endpoint: 'getTenderAwards', description: 'Awarded tenders with savings' },
    ],
    auctions: [
      { id: 'auction-activity', name: 'Auction Activity', endpoint: 'getAuctionActivity', description: 'Auction creation and completion' },
      { id: 'auction-bids', name: 'Auction Bids', endpoint: 'getAuctionBids', description: 'Bidding statistics' },
      { id: 'auction-revenue', name: 'Auction Revenue', endpoint: 'getAuctionRevenue', description: 'Revenue from auctions' },
    ],
    financial: [
      { id: 'revenue', name: 'Revenue Report', endpoint: 'getRevenue', description: 'Total revenue over time' },
      { id: 'payment-methods', name: 'Payment Methods', endpoint: 'getPaymentMethods', description: 'Payment distribution by method' },
      { id: 'transactions', name: 'Transactions', endpoint: 'getTransactions', description: 'Detailed transaction list' },
      { id: 'profit-loss', name: 'Profit & Loss', endpoint: 'getProfitLoss', description: 'Revenue, expenses, and profit' },
    ],
    inventory: [
      { id: 'inventory-levels', name: 'Inventory Levels', endpoint: 'getInventoryLevels', description: 'Current inventory levels' },
      { id: 'inventory-movements', name: 'Inventory Movements', endpoint: 'getInventoryMovements', description: 'Inventory movements over time' },
      { id: 'stock-balance', name: 'Stock Balance', endpoint: 'getStockBalance', description: 'Stock balances by warehouse' },
      { id: 'warehouses', name: 'Warehouses', endpoint: 'getWarehouses', description: 'Warehouse information' },
    ],
    performance: [
      { id: 'system-performance', name: 'System Performance', endpoint: 'getSystemPerformance', description: 'Overall system metrics' },
      { id: 'conversion-rate', name: 'Conversion Rate', endpoint: 'getConversionRate', description: 'Conversion rates for tenders/auctions' },
      { id: 'retention', name: 'Retention', endpoint: 'getRetention', description: 'User retention metrics' },
    ],
    market: [
      { id: 'market-trends', name: 'Market Trends', endpoint: 'getMarketTrends', description: 'Market price trends' },
      { id: 'price-comparison', name: 'Price Comparison', endpoint: 'getPriceComparison', description: 'Price comparisons across locations' },
      { id: 'supply-demand', name: 'Supply & Demand', endpoint: 'getSupplyDemand', description: 'Supply and demand balance' },
    ],
    losses: [
      { id: 'losses', name: 'Loss Report', endpoint: 'getLosses', description: 'Product loss quantities' },
      { id: 'losses-by-product', name: 'Loss by Product', endpoint: 'getLossesByProduct', description: 'Loss quantities by product' },
      { id: 'losses-by-location', name: 'Loss by Location', endpoint: 'getLossesByLocation', description: 'Loss quantities by location' },
    ],
  }

  // Filter states
  const [governorates, setGovernorates] = useState([])
  const [products, setProducts] = useState([])
  const [productCategories, setProductCategories] = useState([])
  const [users, setUsers] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(true)
  
  // Selected filters
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    timeGroup: 'day',
    governorate: null,
    governorateId: null,
    cityId: null,
    areaId: null,
    productId: null,
    categoryId: null,
    subCategoryId: null,
    userId: null,
    userType: null,
    isVerified: null,
    status: null,
    transportProviderId: null,
    fromArea: null,
    toArea: null,
    tenderId: null,
    auctionId: null,
    page: 1,
    pageSize: 50,
    sortBy: null,
    sortOrder: 'desc',
  })
  
  // Active category and report
  const [activeCategory, setActiveCategory] = useState('sales')
  const [activeReport, setActiveReport] = useState(null)
  
  // Report data
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch filters on mount
  useEffect(() => {
    fetchFilters()
  }, [])

  // Fetch report data when filters or report change
  useEffect(() => {
    if (activeReport) {
      fetchReportData()
    }
  }, [activeReport, filters])

  const fetchFilters = async () => {
    try {
      setLoadingFilters(true)
      const [productsRes, categoriesRes, usersRes] = await Promise.all([
        adminService.getProducts().catch(() => ({ data: [] })),
        adminService.getCategories().catch(() => ({ data: [] })),
        adminService.getUsers().catch(() => ({ data: [] }))
      ])
      
      setProducts(productsRes.data || [])
      setProductCategories(categoriesRes.data || [])
      setUsers(usersRes.data || [])
      
      // Try to get governorates
      try {
        const marketAnalysisService = await import('../services/marketAnalysisService')
        const filtersRes = await marketAnalysisService.default.getAvailableFilters()
        const govs = filtersRes.data?.governorates || filtersRes.governorates || []
        setGovernorates(govs)
      } catch (e) {
        console.warn('Could not fetch governorates:', e)
      }
    } catch (error) {
      console.error('Failed to fetch filters:', error)
    } finally {
      setLoadingFilters(false)
    }
  }

  const fetchReportData = async () => {
    if (!activeReport) return
    
    try {
      setLoading(true)
      setError(null)
      
      const reportDef = reportDefinitions[activeCategory].find(r => r.id === activeReport)
      if (!reportDef) return
      
      const serviceMethod = reportsService[reportDef.endpoint]
      if (!serviceMethod) {
        throw new Error(`Report method ${reportDef.endpoint} not found`)
      }
      
      const response = await serviceMethod(filters)
      const data = response.data || response
      setReportData(data)
    } catch (err) {
      console.error('Failed to fetch report data:', err)
      setError(err.message || 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || null,
      page: key === 'page' ? value : 1 // Reset to page 1 when other filters change
    }))
  }

  const handleReportSelect = (reportId) => {
    setActiveReport(reportId)
    setReportData(null)
    setError(null)
  }

  const formatDateForAPI = (dateString) => {
    if (!dateString) return null
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `${dateString}T00:00:00Z`
    }
    const date = new Date(dateString)
    return date.toISOString()
  }

  const formatReportData = (data, reportId) => {
    if (!data) return null
    
    // Handle different response formats
    const reportData = data.data || data
    
    // Format based on report type
    if (reportId.includes('trend') || reportId.includes('activity') || reportId.includes('movement')) {
      // Time series data
      return Array.isArray(reportData) ? reportData : (reportData.data || [])
    } else if (reportId.includes('distribution') || reportId.includes('category') || reportId.includes('type')) {
      // Distribution data
      return Array.isArray(reportData) ? reportData : (reportData.distribution || reportData.data || [])
    } else if (reportId.includes('performance') || reportId.includes('top')) {
      // List data
      return Array.isArray(reportData) ? reportData : (reportData.items || reportData.data || [])
    }
    
    return Array.isArray(reportData) ? reportData : (reportData.data || [])
  }

  const renderReportContent = () => {
    if (!activeReport) {
      return (
        <div className="no-report-selected">
          <p>Please select a report from the list above</p>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="loading-state">
          <p>Loading report data...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="error-state">
          <p>Error: {error}</p>
          <button className="btn btn-primary" onClick={fetchReportData}>
            <FiRefreshCw /> Retry
          </button>
        </div>
      )
    }

    if (!reportData) {
      return (
        <div className="no-data-state">
          <p>No data available for this report</p>
        </div>
      )
    }

    const reportDef = reportDefinitions[activeCategory].find(r => r.id === activeReport)
    const formattedData = formatReportData(reportData, activeReport)
    const summary = reportData.summary || reportData

    // Render based on report type
    if (activeReport.includes('trend') || activeReport.includes('activity') || activeReport.includes('movement')) {
      return renderTimeSeriesReport(formattedData, summary, reportDef)
    } else if (activeReport.includes('distribution') || activeReport.includes('category') || activeReport.includes('type')) {
      return renderDistributionReport(formattedData, summary, reportDef)
    } else if (activeReport.includes('performance') || activeReport.includes('top') || activeReport.includes('list')) {
      return renderListReport(formattedData, summary, reportDef)
    } else {
      return renderGenericReport(formattedData, summary, reportDef)
    }
  }

  const renderTimeSeriesReport = (data, summary, reportDef) => {
    if (!data || data.length === 0) {
      return <div className="no-data">No data available</div>
    }

    // Determine data keys
    const firstItem = data[0]
    const keys = Object.keys(firstItem).filter(k => 
      k !== 'period' && k !== 'date' && k !== 'time' && 
      k !== 'id' && typeof firstItem[k] === 'number'
    )
    const periodKey = firstItem.period ? 'period' : (firstItem.date ? 'date' : (firstItem.time ? 'time' : Object.keys(firstItem)[0]))

    // If multiple numeric keys, use composed chart
    const useComposed = keys.length > 1

    return (
      <div className="report-content">
        {summary && (
          <div className="stats-grid">
            {summary.totalSales !== undefined && (
              <StatCard title="Total Sales" value={`${Number(summary.totalSales).toLocaleString()} IQD`} icon={<FiDollarSign />} color="primary" />
            )}
            {summary.totalQuantity !== undefined && (
              <StatCard title="Total Quantity" value={`${Number(summary.totalQuantity).toLocaleString()}`} icon={<FiPackage />} color="success" />
            )}
            {summary.totalTransactions !== undefined && (
              <StatCard title="Total Transactions" value={Number(summary.totalTransactions).toLocaleString()} icon={<FiActivity />} color="info" />
            )}
            {summary.averagePrice !== undefined && (
              <StatCard title="Average Price" value={`${Number(summary.averagePrice).toLocaleString()} IQD`} icon={<FiTrendingUp />} color="warning" />
            )}
            {summary.totalRevenue !== undefined && (
              <StatCard title="Total Revenue" value={`${Number(summary.totalRevenue).toLocaleString()} IQD`} icon={<FiDollarSign />} color="primary" />
            )}
            {summary.totalUsers !== undefined && (
              <StatCard title="Total Users" value={Number(summary.totalUsers).toLocaleString()} icon={<FiUsers />} color="success" />
            )}
          </div>
        )}
        
        {useComposed ? (
          <Chart
            type="composed"
            data={data}
            dataKeys={keys.slice(0, 3).map(key => ({
              dataKey: key,
              name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
              type: keys.indexOf(key) === keys.length - 1 ? 'line' : 'bar',
              color: ['#6366f1', '#10b981', '#f59e0b'][keys.indexOf(key) % 3]
            }))}
            xAxisKey={periodKey}
            title={reportDef.name}
            height={400}
          />
        ) : (
          <Chart
            type="area"
            data={data}
            dataKey={keys[0] || 'value'}
            xAxisKey={periodKey}
            title={reportDef.name}
            height={400}
          />
        )}
      </div>
    )
  }

  const renderDistributionReport = (data, summary, reportDef) => {
    if (!data || data.length === 0) {
      return <div className="no-data">No data available</div>
    }

    const nameKey = data[0].name ? 'name' : (data[0].label ? 'label' : Object.keys(data[0])[0])
    const valueKey = data[0].value ? 'value' : (data[0].count ? 'count' : Object.keys(data[0])[1])

    return (
      <div className="report-content">
        <div className="charts-grid">
          <Chart
            type="pie"
            data={data}
            dataKey={valueKey}
            title={reportDef.name}
            height={400}
            pieLabel={true}
          />
          <Chart
            type="bar"
            data={data}
            dataKey={valueKey}
            xAxisKey={nameKey}
            title={reportDef.name}
            height={400}
          />
        </div>
      </div>
    )
  }

  const renderListReport = (data, summary, reportDef) => {
    if (!data || data.length === 0) {
      return <div className="no-data">No data available</div>
    }

    const columns = Object.keys(data[0]).map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      accessor: key,
      render: (value) => {
        if (typeof value === 'number') {
          return value.toLocaleString()
        }
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No'
        }
        return value || '-'
      }
    }))

    return (
      <div className="report-content">
        {summary && (
          <div className="stats-grid">
            {Object.entries(summary).slice(0, 4).map(([key, value]) => (
              <StatCard
                key={key}
                title={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                value={typeof value === 'number' ? value.toLocaleString() : String(value)}
                icon={<FiBarChart2 />}
                color="primary"
              />
            ))}
          </div>
        )}
        <div className="card">
          <h3>{reportDef.name}</h3>
          <Table columns={columns} data={data} />
        </div>
      </div>
    )
  }

  const renderGenericReport = (data, summary, reportDef) => {
    return (
      <div className="report-content">
        {summary && (
          <div className="stats-grid">
            {Object.entries(summary).slice(0, 4).map(([key, value]) => (
              <StatCard
                key={key}
                title={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                value={typeof value === 'number' ? value.toLocaleString() : String(value)}
                icon={<FiBarChart2 />}
                color="primary"
              />
            ))}
          </div>
        )}
        
        {data && Array.isArray(data) && data.length > 0 && (
          <div className="card">
            <h3>Data</h3>
            <pre style={{ maxHeight: '500px', overflow: 'auto' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comprehensive Reports</h1>
          <p className="page-subtitle">40+ reports covering all aspects of the platform</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchReportData} disabled={!activeReport || loading}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="reports-tabs">
        {reportCategories.map(cat => (
          <button
            key={cat.id}
            className={`tab-button ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat.id)
              setActiveReport(null)
              setReportData(null)
            }}
          >
            {cat.icon} {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      <div className="reports-layout">
        {/* Report Selector Sidebar */}
        <div className="report-selector card">
          <h3>Select Report</h3>
          <div className="report-list">
            {reportDefinitions[activeCategory]?.map(report => (
              <button
                key={report.id}
                className={`report-item ${activeReport === report.id ? 'active' : ''}`}
                onClick={() => handleReportSelect(report.id)}
              >
                <div className="report-item-header">
                  <span className="report-item-name">{report.name}</span>
                </div>
                <span className="report-item-desc">{report.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="reports-main">
          {/* Filters Panel */}
          <div className="filters-panel card">
            <div className="filters-header">
              <h3><FiFilter /> Filters</h3>
            </div>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  className="filter-select"
                  value={filters.startDate ? filters.startDate.split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('startDate', formatDateForAPI(e.target.value))}
                />
              </div>

              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  className="filter-select"
                  value={filters.endDate ? filters.endDate.split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('endDate', formatDateForAPI(e.target.value))}
                />
              </div>

              <div className="filter-group">
                <label>Time Group</label>
                <select
                  className="filter-select"
                  value={filters.timeGroup}
                  onChange={(e) => handleFilterChange('timeGroup', e.target.value)}
                >
                  <option value="minute">Minute</option>
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Governorate</label>
                <select
                  className="filter-select"
                  value={filters.governorate || ''}
                  onChange={(e) => handleFilterChange('governorate', e.target.value || null)}
                  disabled={loadingFilters}
                >
                  <option value="">All Governorates</option>
                  {governorates.map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Product</label>
                <select
                  className="filter-select"
                  value={filters.productId || ''}
                  onChange={(e) => handleFilterChange('productId', e.target.value ? Number(e.target.value) : null)}
                  disabled={loadingFilters}
                >
                  <option value="">All Products</option>
                  {products.map(product => (
                    <option key={product.productId || product.id} value={product.productId || product.id}>
                      {product.nameEn || product.nameAr || product.name || `Product ${product.productId || product.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Category</label>
                <select
                  className="filter-select"
                  value={filters.categoryId || ''}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value ? Number(e.target.value) : null)}
                  disabled={loadingFilters}
                >
                  <option value="">All Categories</option>
                  {productCategories.map(cat => (
                    <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>
                      {cat.nameEn || cat.nameAr || cat.name || `Category ${cat.categoryId || cat.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>User Type</label>
                <select
                  className="filter-select"
                  value={filters.userType || ''}
                  onChange={(e) => handleFilterChange('userType', e.target.value || null)}
                >
                  <option value="">All Types</option>
                  <option value="farmer">Farmer</option>
                  <option value="trader">Trader</option>
                  <option value="transporter">Transporter</option>
                  <option value="buyer">Buyer</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Status</label>
                <select
                  className="filter-select"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || null)}
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="completed">Completed</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Report Content */}
          {renderReportContent()}
        </div>
      </div>
    </div>
  )
}

export default Reports
