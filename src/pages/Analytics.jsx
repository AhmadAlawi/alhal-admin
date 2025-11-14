import React, { useState, useEffect } from 'react'
import { FiFilter, FiRefreshCw, FiDownload, FiTrendingUp, FiBarChart2, FiPieChart, FiActivity } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import Chart from '../components/Chart/Chart'
import Table from '../components/Table/Table'
import marketAnalysisService from '../services/marketAnalysisService'
import adminService from '../services/adminService'
import './Analytics.css'

const Analytics = () => {
  // Filter states
  const [products, setProducts] = useState([])
  const [availableFilters, setAvailableFilters] = useState(null)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingFilters, setLoadingFilters] = useState(true)
  
  // Selected filters
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedGovernorate, setSelectedGovernorate] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  })
  const [groupBy, setGroupBy] = useState('day')
  
  // Data states
  const [dashboardSummary, setDashboardSummary] = useState(null)
  const [priceTrends, setPriceTrends] = useState(null)
  const [volumeData, setVolumeData] = useState(null)
  const [marketShare, setMarketShare] = useState(null)
  const [transactionDist, setTransactionDist] = useState(null)
  const [priceVolatility, setPriceVolatility] = useState(null)
  const [supplyDemand, setSupplyDemand] = useState(null)
  const [topProducts, setTopProducts] = useState(null)
  
  // Loading states
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  // Fetch products and available filters on mount
  useEffect(() => {
    fetchProducts()
    fetchAvailableFilters()
  }, [])

  // Fetch data when filters change
  useEffect(() => {
    if (selectedProduct) {
      fetchAllData()
    }
  }, [selectedProduct, selectedGovernorate, dateRange, groupBy])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await adminService.getProducts()
      const productsList = response.data || response || []
      setProducts(productsList)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchAvailableFilters = async () => {
    try {
      setLoadingFilters(true)
      const response = await marketAnalysisService.getAvailableFilters()
      setAvailableFilters(response.data || response)
    } catch (error) {
      console.error('Failed to fetch filters:', error)
    } finally {
      setLoadingFilters(false)
    }
  }

  const fetchAllData = async () => {
    // Build params
    const params = {
      productId: selectedProduct,
      governorate: selectedGovernorate,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy
    }

    // Fetch all charts in parallel
    const promises = [
      fetchDashboardSummary(params),
      fetchPriceTrends(params),
      fetchVolumeByGovernorate(params),
      fetchMarketShare(params),
      fetchTransactionDistribution(params),
      fetchPriceVolatility(params),
      fetchSupplyDemand(params),
      fetchTopProducts(params)
    ]

    await Promise.allSettled(promises)
  }

  const fetchDashboardSummary = async (params) => {
    try {
      setLoading(prev => ({ ...prev, summary: true }))
      const response = await marketAnalysisService.getDashboardSummary(params.governorate)
      setDashboardSummary(response.data || response)
      setErrors(prev => ({ ...prev, summary: null }))
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error)
      setErrors(prev => ({ ...prev, summary: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, summary: false }))
    }
  }

  const fetchPriceTrends = async (params) => {
    try {
      setLoading(prev => ({ ...prev, priceTrends: true }))
      const response = await marketAnalysisService.getPriceTrends(params)
      setPriceTrends(response.data || response)
      setErrors(prev => ({ ...prev, priceTrends: null }))
    } catch (error) {
      console.error('Failed to fetch price trends:', error)
      setErrors(prev => ({ ...prev, priceTrends: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, priceTrends: false }))
    }
  }

  const fetchVolumeByGovernorate = async (params) => {
    try {
      setLoading(prev => ({ ...prev, volume: true }))
      const response = await marketAnalysisService.getVolumeByGovernorate(params)
      setVolumeData(response.data || response)
      setErrors(prev => ({ ...prev, volume: null }))
    } catch (error) {
      console.error('Failed to fetch volume data:', error)
      setErrors(prev => ({ ...prev, volume: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, volume: false }))
    }
  }

  const fetchMarketShare = async (params) => {
    try {
      setLoading(prev => ({ ...prev, marketShare: true }))
      const response = await marketAnalysisService.getMarketShareByProduct(params)
      setMarketShare(response.data || response)
      setErrors(prev => ({ ...prev, marketShare: null }))
    } catch (error) {
      console.error('Failed to fetch market share:', error)
      setErrors(prev => ({ ...prev, marketShare: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, marketShare: false }))
    }
  }

  const fetchTransactionDistribution = async (params) => {
    try {
      setLoading(prev => ({ ...prev, transaction: true }))
      const response = await marketAnalysisService.getTransactionTypeDistribution(params)
      setTransactionDist(response.data || response)
      setErrors(prev => ({ ...prev, transaction: null }))
    } catch (error) {
      console.error('Failed to fetch transaction distribution:', error)
      setErrors(prev => ({ ...prev, transaction: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, transaction: false }))
    }
  }

  const fetchPriceVolatility = async (params) => {
    try {
      setLoading(prev => ({ ...prev, volatility: true }))
      const response = await marketAnalysisService.getPriceVolatility(params)
      setPriceVolatility(response.data || response)
      setErrors(prev => ({ ...prev, volatility: null }))
    } catch (error) {
      console.error('Failed to fetch price volatility:', error)
      setErrors(prev => ({ ...prev, volatility: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, volatility: false }))
    }
  }

  const fetchSupplyDemand = async (params) => {
    try {
      setLoading(prev => ({ ...prev, supplyDemand: true }))
      const response = await marketAnalysisService.getSupplyDemandTrends({
        productId: params.productId,
        governorate: params.governorate,
        days: 30
      })
      setSupplyDemand(response.data || response)
      setErrors(prev => ({ ...prev, supplyDemand: null }))
    } catch (error) {
      console.error('Failed to fetch supply/demand:', error)
      setErrors(prev => ({ ...prev, supplyDemand: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, supplyDemand: false }))
    }
  }

  const fetchTopProducts = async (params) => {
    try {
      setLoading(prev => ({ ...prev, topProducts: true }))
      const response = await marketAnalysisService.getTopProductsByRevenue({
        governorate: params.governorate,
        startDate: params.startDate,
        endDate: params.endDate,
        topN: 10
      })
      setTopProducts(response.data || response)
      setErrors(prev => ({ ...prev, topProducts: null }))
    } catch (error) {
      console.error('Failed to fetch top products:', error)
      setErrors(prev => ({ ...prev, topProducts: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, topProducts: false }))
    }
  }

  // Format functions
  const formatPriceTrendsData = (data) => {
    if (!data || !data.averagePrice) return []
    return data.averagePrice.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avgPrice: item.value || 0,
      minPrice: data.minPrice?.find(p => p.date === item.date)?.value || 0,
      maxPrice: data.maxPrice?.find(p => p.date === item.date)?.value || 0
    }))
  }

  const formatVolumeData = (data) => {
    if (!data || !data.data) return []
    return data.data.map(item => ({
      governorate: item.category || item.governorate,
      volume: item.value || 0
    }))
  }

  const formatMarketShareData = (data) => {
    if (!data || !data.items) return []
    return data.items.slice(0, 5).map(item => ({
      name: item.productName,
      value: item.revenue || 0,
      percentage: item.percentage || 0
    }))
  }

  const formatTransactionData = (data) => {
    if (!data || !data.data) return []
    return data.data.map(item => ({
      name: item.category === 'direct' ? 'Direct Sales' : 
            item.category === 'auction' ? 'Auctions' : 'Tenders',
      value: item.value || 0
    }))
  }

  const formatSupplyDemandData = (data) => {
    if (!data || !data.supply || !data.demand) return []
    return data.supply.map((item, index) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      supply: item.value || 0,
      demand: data.demand[index]?.value || 0
    }))
  }

  const formatTopProductsData = (data) => {
    if (!data || !Array.isArray(data)) return []
    return data.slice(0, 10).map(item => ({
      name: item.productName || item.name,
      revenue: item.totalRevenue || item.revenue || 0,
      volume: item.totalVolume || item.volume || 0
    }))
  }

  const getProductName = (productId) => {
    const product = products.find(p => p.productId === productId)
    return product ? (product.nameEn || product.nameAr || `Product ${productId}`) : `Product ${productId}`
  }

  const handleRefresh = () => {
    if (selectedProduct) {
      fetchAllData()
    }
  }

  const priceTrendsChartData = formatPriceTrendsData(priceTrends)
  const volumeChartData = formatVolumeData(volumeData)
  const marketShareChartData = formatMarketShareData(marketShare)
  const transactionChartData = formatTransactionData(transactionDist)
  const supplyDemandChartData = formatSupplyDemandData(supplyDemand)
  const topProductsChartData = formatTopProductsData(topProducts)

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Market Analysis & Analytics</h1>
          <p className="page-subtitle">Comprehensive market insights and trend analysis</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleRefresh} disabled={!selectedProduct}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="filters-panel card">
        <div className="filters-header">
          <h3><FiFilter /> Filters</h3>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Product *</label>
            <select 
              className="filter-select"
              value={selectedProduct || ''}
              onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingProducts}
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.productId} value={product.productId}>
                  {product.nameEn || product.nameAr || `Product ${product.productId}`}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Governorate</label>
            <select 
              className="filter-select"
              value={selectedGovernorate || ''}
              onChange={(e) => setSelectedGovernorate(e.target.value || null)}
              disabled={loadingFilters}
            >
              <option value="">All Governorates</option>
              {availableFilters?.governorates?.map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input 
              type="date"
              className="filter-select"
              value={dateRange.startDate || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input 
              type="date"
              className="filter-select"
              value={dateRange.endDate || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label>Group By</label>
            <select 
              className="filter-select"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboardSummary?.kpis && (
        <div className="stats-grid">
          {dashboardSummary.kpis.slice(0, 4).map((kpi, index) => (
            <StatCard
              key={index}
              title={kpi.title}
              value={kpi.value?.toLocaleString ? kpi.value.toLocaleString() : kpi.value}
              change={kpi.change}
              icon={<FiTrendingUp />}
              color={index === 0 ? 'success' : index === 1 ? 'primary' : index === 2 ? 'warning' : 'danger'}
            />
          ))}
        </div>
      )}

      {!selectedProduct && !loadingProducts && products.length > 0 && (
        <div className="info-message card">
          <p><FiBarChart2 /> Please select a product to view detailed analytics</p>
        </div>
      )}

      {selectedProduct && (
        <>
          {/* Selected Product Banner */}
          <div className="selected-product-info">
            <h3 className="selected-product-title">
              Analyzing: <span className="product-name">{getProductName(selectedProduct)}</span>
              {selectedGovernorate && <span className="governorate-tag"> in {selectedGovernorate}</span>}
            </h3>
          </div>

          {/* Price Trends Chart */}
          {priceTrendsChartData.length > 0 ? (
            <div className="chart-section">
              <Chart
                type="line"
                data={priceTrendsChartData}
                dataKey="avgPrice"
                xAxisKey="date"
                title={`Price Trends for ${getProductName(selectedProduct)}`}
                color="#6366f1"
              />
            </div>
          ) : loading.priceTrends ? (
            <div className="loading-chart card">
              <p>Loading price trends...</p>
            </div>
          ) : null}

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Volume by Governorate */}
            {volumeChartData.length > 0 && (
              <Chart
                type="bar"
                data={volumeChartData}
                dataKey="volume"
                xAxisKey="governorate"
                title="Sales Volume by Governorate"
                color="#10b981"
              />
            )}

            {/* Market Share */}
            {marketShareChartData.length > 0 && (
              <Chart
                type="bar"
                data={marketShareChartData}
                dataKey="value"
                xAxisKey="name"
                title="Market Share by Product"
                color="#f59e0b"
              />
            )}

            {/* Transaction Distribution */}
            {transactionChartData.length > 0 && (
              <Chart
                type="bar"
                data={transactionChartData}
                dataKey="value"
                xAxisKey="name"
                title="Transaction Type Distribution"
                color="#ef4444"
              />
            )}

            {/* Supply vs Demand */}
            {supplyDemandChartData.length > 0 && (
              <Chart
                type="line"
                data={supplyDemandChartData}
                dataKey="supply"
                xAxisKey="date"
                title="Supply vs Demand Trends"
                color="#8b5cf6"
              />
            )}
          </div>

          {/* Top Products Section */}
          {topProductsChartData.length > 0 && (
            <div className="chart-section">
              <Chart
                type="bar"
                data={topProductsChartData}
                dataKey="revenue"
                xAxisKey="name"
                title="Top 10 Products by Revenue"
                color="#06b6d4"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Analytics
