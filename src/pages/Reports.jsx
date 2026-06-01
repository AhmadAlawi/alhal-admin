import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiFilter, FiRefreshCw, FiDownload, FiTrendingUp, FiBarChart2, FiPieChart, FiActivity, FiDatabase, FiUsers, FiPackage, FiTruck, FiFileText, FiAward, FiDollarSign, FiBox, FiZap, FiTrendingDown, FiShoppingCart, FiMapPin, FiEdit3 } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import Chart from '../components/Chart/Chart'
import reportsService from '../services/reportsService'
import adminService from '../services/adminService'
import governoratesService from '../services/governoratesService'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../contexts/LocaleContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { buildReportChartConfig } from '../utils/reportChartNormalize'
import './Reports.css'

const SUMMARY_SKIP = new Set(['page', 'pageSize', 'totalPages', 'totalCount', 'success', 'message', 'data'])

function isCurrencyMetricKey(key) {
  const lower = key.toLowerCase()
  return (
    lower.includes('revenue') ||
    lower.includes('sales') ||
    lower.includes('profit') ||
    lower.includes('loss') ||
    lower.includes('expense') ||
    lower.includes('amount') ||
    lower.includes('price')
  )
}

function formatMetricLabel(key) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
}

const Reports = () => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const { formatMoney, formatQty } = useCurrency()
  const chartLocale = language === 'ar' ? 'ar-SY' : 'en-US'
  
  // Report categories (names from t via nameKey)
  const reportCategories = [
    { id: 'sales', nameKey: 'categorySales', icon: <FiShoppingCart />, count: 5 },
    { id: 'users', nameKey: 'categoryUsers', icon: <FiUsers />, count: 5 },
    { id: 'products', nameKey: 'categoryProducts', icon: <FiPackage />, count: 5 },
    { id: 'transport', nameKey: 'categoryTransport', icon: <FiTruck />, count: 5 },
    { id: 'tenders', nameKey: 'categoryTenders', icon: <FiFileText />, count: 4 },
    { id: 'auctions', nameKey: 'categoryAuctions', icon: <FiAward />, count: 3 },
    { id: 'financial', nameKey: 'categoryFinancial', icon: <FiDollarSign />, count: 4 },
    { id: 'inventory', nameKey: 'categoryInventory', icon: <FiBox />, count: 4 },
    { id: 'performance', nameKey: 'categoryPerformance', icon: <FiZap />, count: 3 },
    { id: 'market', nameKey: 'categoryMarket', icon: <FiBarChart2 />, count: 3 },
    { id: 'losses', nameKey: 'categoryLosses', icon: <FiTrendingDown />, count: 3 },
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
  }, [language])

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
      
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : [])
      setProductCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : [])
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
      
      try {
        const govs = await governoratesService.getOptions(language)
        setGovernorates(govs)
      } catch (e) {
        console.warn('Could not fetch governorates:', e)
        setGovernorates([])
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

  const renderSummaryCards = (summary) => {
    if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return null

    const entries = Object.entries(summary).filter(
      ([key, value]) => typeof value === 'number' && !SUMMARY_SKIP.has(key)
    )
    if (!entries.length) return null

    return (
      <div className="stats-grid">
        {entries.slice(0, 6).map(([key, value]) => (
          <StatCard
            key={key}
            title={formatMetricLabel(key)}
            value={
              isCurrencyMetricKey(key)
                ? formatMoney(value)
                : formatQty(value)
            }
            icon={<FiBarChart2 />}
            color="primary"
          />
        ))}
      </div>
    )
  }

  const renderChartFromConfig = (config, reportDef) => {
    const title = t('reports.reportNames.' + reportDef.id) || reportDef.name

    if (config.kind === 'empty') {
      return (
        <div className="report-content">
          {renderSummaryCards(config.summary)}
          <div className="no-data">{t('reports.noDataAvailable')}</div>
        </div>
      )
    }

    if (config.kind === 'composed') {
      return (
        <div className="report-content">
          {renderSummaryCards(config.summary)}
          <Chart
            type="composed"
            data={config.rows}
            dataKeys={config.dataKeys.map((item) => ({
              ...item,
              name: formatMetricLabel(item.dataKey),
            }))}
            xAxisKey={config.periodKey}
            title={title}
            height={400}
            scrollable
          />
        </div>
      )
    }

    if (config.kind === 'area') {
      const seriesName = formatMetricLabel(config.dataKey)
      return (
        <div className="report-content">
          {renderSummaryCards(config.summary)}
          <Chart
            type="area"
            data={config.rows}
            dataKey={config.dataKey}
            seriesName={seriesName}
            xAxisKey={config.periodKey}
            title={title}
            height={400}
            scrollable
          />
        </div>
      )
    }

    if (config.kind === 'distribution') {
      return (
        <div className="report-content">
          {renderSummaryCards(config.summary)}
          <div className="charts-grid">
            <Chart
              type="pie"
              data={config.rows}
              dataKey={config.valueKey}
              nameKey={config.nameKey}
              title={title}
              height={400}
              pieLabel={true}
            />
            <Chart
              type="bar"
              data={config.rows}
              dataKey={config.valueKey}
              xAxisKey={config.nameKey}
              title={title}
              height={400}
            />
          </div>
        </div>
      )
    }

    const seriesName = formatMetricLabel(config.valueKey)
    return (
      <div className="report-content">
        {renderSummaryCards(config.summary)}
        <Chart
          type="bar"
          data={config.rows}
          dataKey={config.valueKey}
          dataKeys={[{ dataKey: config.valueKey, name: seriesName }]}
          xAxisKey={config.nameKey}
          title={title}
          height={400}
        />
      </div>
    )
  }

  const renderReportContent = () => {
    if (!activeReport) {
      return (
        <div className="no-report-selected">
          <p>{t('reports.pleaseSelectReport')}</p>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="loading-state">
          <p>{t('reports.loadingReportData')}</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="error-state">
          <p>{t('reports.errorLabel')}: {error}</p>
          <button type="button" className="btn btn-primary" onClick={fetchReportData}>
            <FiRefreshCw /> {t('reports.retry')}
          </button>
        </div>
      )
    }

    if (!reportData) {
      return (
        <div className="no-data-state">
          <p>{t('reports.noDataForReport')}</p>
        </div>
      )
    }

    const reportDef = reportDefinitions[activeCategory].find(r => r.id === activeReport)
    const chartConfig = buildReportChartConfig(reportData, activeReport, chartLocale)
    return renderChartFromConfig(chartConfig, reportDef)
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('reports.comprehensiveReports')}</h1>
          <p className="page-subtitle">{t('reports.reportsSubtitle')}</p>
        </div>
        <div className="header-actions">
          <Link to="/reports/builder" className="btn btn-outline">
            <FiEdit3 /> {t('reportBuilder.title')}
          </Link>
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
            {cat.icon} {t('reports.' + cat.nameKey)} ({cat.count})
          </button>
        ))}
      </div>

      <div className="reports-layout">
        {/* Report Selector Sidebar */}
        <div className="report-selector card">
          <h3>{t('reports.selectReport')}</h3>
          <div className="report-list">
            {reportDefinitions[activeCategory]?.map(report => (
              <button
                key={report.id}
                className={`report-item ${activeReport === report.id ? 'active' : ''}`}
                onClick={() => handleReportSelect(report.id)}
              >
                <div className="report-item-header">
                  <span className="report-item-name">{t('reports.reportNames.' + report.id) || report.name}</span>
                </div>
                <span className="report-item-desc">{t('reports.reportDescriptions.' + report.id) || report.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="reports-main">
          {/* Filters Panel */}
          <div className="filters-panel card">
            <div className="filters-header">
              <h3><FiFilter /> {t('reports.filters')}</h3>
            </div>
            <div className="filters-grid">
              <div className="filter-group">
                <label>{t('reports.startDate')}</label>
                <input
                  type="date"
                  className="filter-select"
                  value={filters.startDate ? filters.startDate.split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('startDate', formatDateForAPI(e.target.value))}
                />
              </div>

              <div className="filter-group">
                <label>{t('reports.endDate')}</label>
                <input
                  type="date"
                  className="filter-select"
                  value={filters.endDate ? filters.endDate.split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('endDate', formatDateForAPI(e.target.value))}
                />
              </div>

              <div className="filter-group">
                <label>{t('reports.timeGroup')}</label>
                <select
                  className="filter-select"
                  value={filters.timeGroup}
                  onChange={(e) => handleFilterChange('timeGroup', e.target.value)}
                >
                  <option value="minute">{t('reports.minute')}</option>
                  <option value="hour">{t('reports.hour')}</option>
                  <option value="day">{t('reports.day')}</option>
                  <option value="week">{t('reports.week')}</option>
                  <option value="month">{t('reports.month')}</option>
                  <option value="year">{t('reports.year')}</option>
                </select>
              </div>

              <div className="filter-group">
                <label>{t('reports.governorate')}</label>
                <select
                  className="filter-select"
                  value={filters.governorateId || ''}
                  onChange={(e) => {
                    const id = e.target.value
                    handleFilterChange('governorateId', id ? Number(id) : null)
                    handleFilterChange('governorate', null)
                  }}
                  disabled={loadingFilters}
                >
                  <option value="">{t('reports.allGovernorates')}</option>
                  {governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>
                      {gov.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>{t('reports.product')}</label>
                <select
                  className="filter-select"
                  value={filters.productId || ''}
                  onChange={(e) => handleFilterChange('productId', e.target.value ? Number(e.target.value) : null)}
                  disabled={loadingFilters}
                >
                  <option value="">{t('reports.allProducts')}</option>
                  {products.map(product => (
                    <option key={product.productId || product.id} value={product.productId || product.id}>
                      {product.nameEn || product.nameAr || product.name || `Product ${product.productId || product.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>{t('reports.category')}</label>
                <select
                  className="filter-select"
                  value={filters.categoryId || ''}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value ? Number(e.target.value) : null)}
                  disabled={loadingFilters}
                >
                  <option value="">{t('reports.allCategories')}</option>
                  {productCategories.map(cat => (
                    <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>
                      {cat.nameEn || cat.nameAr || cat.name || `Category ${cat.categoryId || cat.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>{t('reports.userTypeLabel')}</label>
                <select
                  className="filter-select"
                  value={filters.userType || ''}
                  onChange={(e) => handleFilterChange('userType', e.target.value || null)}
                >
                  <option value="">{t('reports.allTypes')}</option>
                  <option value="farmer">{t('reports.farmer')}</option>
                  <option value="trader">{t('reports.trader')}</option>
                  <option value="transporter">{t('reports.transporter')}</option>
                  <option value="buyer">{t('reports.buyer')}</option>
                </select>
              </div>

              <div className="filter-group">
                <label>{t('common.status')}</label>
                <select
                  className="filter-select"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || null)}
                >
                  <option value="">{t('reports.allStatuses')}</option>
                  <option value="open">{t('reports.statusOpen')}</option>
                  <option value="completed">{t('reports.statusCompleted')}</option>
                  <option value="active">{t('reports.statusActive')}</option>
                  <option value="closed">{t('reports.statusClosed')}</option>
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
