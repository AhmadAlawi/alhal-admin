import React, { useState, useEffect, useMemo } from 'react'
import { FiFilter, FiRefreshCw, FiTrendingUp, FiBarChart2 } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import Chart from '../components/Chart/Chart'
import Table from '../components/Table/Table'
import marketAnalysisService from '../services/marketAnalysisService'
import adminService from '../services/adminService'
import governoratesService from '../services/governoratesService'
import { useTranslation } from '../hooks/useTranslation'
import { useCurrency } from '../contexts/CurrencyContext'
import {
  buildGovernorateLookup,
  resolveGovernorateLabel,
  mapChartGovernorateRows,
} from '../utils/governorateNames'
import {
  formatPriceTrendsChart,
  formatSupplyDemandChart,
  formatPriceVolatilityChart,
  hasChartData,
} from '../utils/chartNormalize'
import './Analytics.css'

const Analytics = () => {
  const { t, language } = useTranslation()
  const { formatMoney, formatQty } = useCurrency()
  const chartLocale = language === 'ar' ? 'ar' : 'en-US'
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
  const [periodPreset, setPeriodPreset] = useState('90') // 90 | all | custom
  const [minQualityScore, setMinQualityScore] = useState('')
  const [governorateOptions, setGovernorateOptions] = useState([])
  
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
    governoratesService.getOptions(language).then(setGovernorateOptions)
  }, [language])

  const governorateLookup = useMemo(
    () => buildGovernorateLookup(governorateOptions),
    [governorateOptions]
  )

  // Fetch data when filters change
  useEffect(() => {
    if (selectedProduct) {
      fetchAllData()
    }
  }, [selectedProduct, selectedGovernorate, dateRange, groupBy, periodPreset, minQualityScore])

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

  const resolveDateRange = () => {
    if (periodPreset === 'all') {
      return { startDate: null, endDate: null }
    }
    if (periodPreset === '90') {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 90)
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      }
    }
    return dateRange
  }

  const fetchAllData = async () => {
    const range = resolveDateRange()
    const govLabel = selectedGovernorate
      ? resolveGovernorateLabel(selectedGovernorate, governorateLookup, language) || selectedGovernorate
      : null

    const params = {
      productId: selectedProduct,
      governorate: govLabel,
      startDate: range.startDate,
      endDate: range.endDate,
      groupBy,
      minQualityScore: minQualityScore !== '' ? Number(minQualityScore) : undefined,
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
      const supplyDays = periodPreset === 'all' ? undefined : periodPreset === '90' ? 90 : 30
      const response = await marketAnalysisService.getSupplyDemandTrends({
        productId: params.productId,
        governorate: params.governorate,
        days: supplyDays,
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

  const formatPriceTrendsData = (data) => formatPriceTrendsChart(data, chartLocale)
  const formatVolatilityData = (data) => formatPriceVolatilityChart(data, chartLocale)

  const formatVolumeData = (data) => {
    if (!data || !data.data) return []
    const rows = data.data.map((item) => ({
      governorate: item.category || item.governorate,
      volume: item.value || 0,
    }))
    return mapChartGovernorateRows(rows, governorateLookup, language)
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
      name: item.category === 'direct' ? t('analytics.directSales') :
            item.category === 'auction' ? t('analytics.auctions') : t('analytics.tenders'),
      value: item.value || 0
    }))
  }

  const formatSupplyDemandData = (data) => formatSupplyDemandChart(data, chartLocale)

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
    return product ? (product.nameEn || product.nameAr || `${t('analytics.productLabel')} ${productId}`) : `${t('analytics.productLabel')} ${productId}`
  }

  const handleRefresh = () => {
    if (selectedProduct) {
      fetchAllData()
    }
  }

  const priceTrendsChartData = formatPriceTrendsData(priceTrends)
  const volatilityChartData = formatVolatilityData(priceVolatility)
  const volumeChartData = formatVolumeData(volumeData)
  const marketShareChartData = formatMarketShareData(marketShare)
  const transactionChartData = formatTransactionData(transactionDist)
  const supplyDemandChartData = formatSupplyDemandData(supplyDemand)
  const topProductsChartData = formatTopProductsData(topProducts)
  const govSelectOptions = useMemo(() => {
    if (governorateOptions.length > 0) return governorateOptions
    return (availableFilters?.governorates ?? []).map((g) => ({
      id: g,
      name: String(g),
    }))
  }, [governorateOptions, availableFilters])

  const selectedGovernorateLabel = selectedGovernorate
    ? resolveGovernorateLabel(selectedGovernorate, governorateLookup, language) || selectedGovernorate
    : null

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('analytics.title')}</h1>
          <p className="page-subtitle">{t('analytics.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleRefresh} disabled={!selectedProduct}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="filters-panel card">
        <div className="filters-header">
          <h3><FiFilter /> {t('analytics.filters')}</h3>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label>{t('analytics.product')} *</label>
            <select 
              className="filter-select"
              value={selectedProduct || ''}
              onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingProducts}
            >
              <option value="">{t('analytics.selectProduct')}</option>
              {products.map(product => (
                <option key={product.productId} value={product.productId}>
                  {product.nameEn || product.nameAr || `Product ${product.productId}`}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('analytics.governorate')}</label>
            <select
              className="filter-select"
              value={selectedGovernorate || ''}
              onChange={(e) => setSelectedGovernorate(e.target.value || null)}
              disabled={loadingFilters}
            >
              <option value="">{t('analytics.allGovernorates')}</option>
              {govSelectOptions.map((gov) => (
                <option key={gov.id} value={String(gov.id)}>
                  {language === 'ar' ? gov.nameAr || gov.name : gov.nameEn || gov.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('analytics.period')}</label>
            <select
              className="filter-select"
              value={periodPreset}
              onChange={(e) => setPeriodPreset(e.target.value)}
            >
              <option value="90">{t('analytics.last90Days')}</option>
              <option value="all">{t('analytics.allTimes')}</option>
              <option value="custom">{t('analytics.customRange')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label>{t('analytics.minQualityScore')}</label>
            <input
              type="number"
              className="filter-select"
              min="0"
              max="100"
              step="1"
              placeholder={t('analytics.qualityScorePlaceholder')}
              value={minQualityScore}
              onChange={(e) => setMinQualityScore(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>{t('analytics.startDate')}</label>
            <input 
              type="date"
              className="filter-select"
              value={dateRange.startDate || ''}
              onChange={(e) => {
                setPeriodPreset('custom')
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }}
              disabled={periodPreset !== 'custom'}
            />
          </div>

          <div className="filter-group">
            <label>{t('analytics.endDate')}</label>
            <input
              type="date"
              className="filter-select"
              value={dateRange.endDate || ''}
              onChange={(e) => {
                setPeriodPreset('custom')
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }}
              disabled={periodPreset !== 'custom'}
            />
          </div>

          <div className="filter-group">
            <label>{t('analytics.groupBy')}</label>
            <select 
              className="filter-select"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="day">{t('analytics.daily')}</option>
              <option value="week">{t('analytics.weekly')}</option>
              <option value="month">{t('analytics.monthly')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboardSummary?.kpis && (
        <div className="stats-grid">
          {dashboardSummary.kpis.slice(0, 4).map((kpi, index) => {
            const titleLower = String(kpi.title || '').toLowerCase()
            const isMoney =
              titleLower.includes('revenue') ||
              titleLower.includes('price') ||
              titleLower.includes('إيراد') ||
              titleLower.includes('سعر')
            const displayValue = isMoney
              ? formatMoney(Number(kpi.value) || 0)
              : formatQty(Number(kpi.value) || kpi.value)
            return (
            <StatCard
              key={index}
              title={kpi.title}
              value={displayValue}
              change={kpi.change}
              icon={<FiTrendingUp />}
              color={index === 0 ? 'success' : index === 1 ? 'primary' : index === 2 ? 'warning' : 'danger'}
            />
          )})}
        </div>
      )}

      {!selectedProduct && !loadingProducts && products.length > 0 && (
        <div className="info-message card">
          <p><FiBarChart2 /> {t('analytics.selectProductPlaceholder')}</p>
        </div>
      )}

      {selectedProduct && (
        <>
          {/* Selected Product Banner */}
          <div className="selected-product-info">
            <h3 className="selected-product-title">
              {t('analytics.analyzing')}: <span className="product-name">{getProductName(selectedProduct)}</span>
              {selectedGovernorateLabel && (
                <span className="governorate-tag"> {t('analytics.in')} {selectedGovernorateLabel}</span>
              )}
            </h3>
          </div>

          {/* Price Trends Chart */}
          {hasChartData(priceTrendsChartData) ? (
            <div className="chart-section">
              <Chart
                type="line"
                data={priceTrendsChartData}
                dataKeys={[
                  { dataKey: 'avgPrice', name: t('analytics.avgPrice'), color: '#6366f1' },
                  { dataKey: 'minPrice', name: t('analytics.minPrice'), color: '#94a3b8' },
                  { dataKey: 'maxPrice', name: t('analytics.maxPrice'), color: '#f59e0b' },
                ]}
                xAxisKey="date"
                xAxisLabel={t('analytics.dateAxis')}
                title={`${t('analytics.priceTrendsFor')} ${getProductName(selectedProduct)}`}
                color="#6366f1"
                yAxisLabel={t('analytics.pricePerKg')}
                scrollable
              />
            </div>
          ) : loading.priceTrends ? (
            <div className="loading-chart card">
              <p>{t('analytics.loadingPriceTrends')}</p>
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
                xAxisLabel={t('analytics.governorate')}
                yAxisLabel={t('analytics.volumeKg')}
                title={t('analytics.salesVolume')}
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
                title={t('analytics.marketShare')}
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
                title={t('analytics.transactionDistribution')}
                color="#ef4444"
              />
            )}

            {/* Supply vs Demand */}
            {supplyDemandChartData.length > 0 && (
              <Chart
                type="bar"
                data={supplyDemandChartData}
                dataKeys={[
                  { dataKey: 'supply', name: t('analytics.supply'), color: '#8b5cf6' },
                  { dataKey: 'demand', name: t('analytics.demand'), color: '#06b6d4' },
                ]}
                xAxisKey="date"
                xAxisLabel={t('analytics.dateAxis')}
                yAxisLabel={t('analytics.quantityKg')}
                title={t('analytics.supplyDemand')}
                color="#8b5cf6"
                scrollable
              />
            )}

            {/* Price volatility */}
            {volatilityChartData.length > 0 && (
              <Chart
                type="area"
                data={volatilityChartData}
                dataKey="volatility"
                xAxisKey="date"
                title={t('analytics.priceVolatility')}
                color="#ec4899"
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
                title={t('analytics.topProducts')}
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
