import React, { useState, useEffect } from 'react'
import { FiFilter, FiRefreshCw, FiDownload, FiTrendingUp, FiBarChart2, FiPieChart, FiActivity, FiDatabase, FiUsers, FiPackage } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import Chart from '../components/Chart/Chart'
import reportsService from '../services/reportsService'
import adminService from '../services/adminService'
import { useTranslation } from '../hooks/useTranslation'
import './Reports.css'

const Reports = () => {
  const { t } = useTranslation()
  
  // Filter states
  const [governorates, setGovernorates] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(true)
  
  // Selected filters
  const [selectedGovernorate, setSelectedGovernorate] = useState(null)
  const [selectedGovernorateId, setSelectedGovernorateId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  })
  const [timeGroup, setTimeGroup] = useState('month')
  
  // Active tab
  const [activeTab, setActiveTab] = useState('ministry') // 'ministry' or 'statistics'
  
  // Ministry Reports Data
  const [monthlyMarketFlow, setMonthlyMarketFlow] = useState(null)
  const [storageCapacity, setStorageCapacity] = useState(null)
  const [currentMonthFlow, setCurrentMonthFlow] = useState(null)
  const [storageUsageRate, setStorageUsageRate] = useState(null)
  const [totalStorageCapacity, setTotalStorageCapacity] = useState(null)
  const [storageTypesDistribution, setStorageTypesDistribution] = useState(null)
  
  // Statistics Reports Data
  const [userAgeGroup, setUserAgeGroup] = useState(null)
  const [userType, setUserType] = useState(null)
  const [userActivity, setUserActivity] = useState(null)
  const [userByGovernorate, setUserByGovernorate] = useState(null)
  const [productionByProduct, setProductionByProduct] = useState(null)
  const [productByCategory, setProductByCategory] = useState(null)
  const [seasonalProduction, setSeasonalProduction] = useState(null)
  
  // Loading and error states
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  // Fetch filters on mount
  useEffect(() => {
    fetchFilters()
  }, [])

  // Fetch data when filters change
  useEffect(() => {
    if (activeTab === 'ministry') {
      fetchMinistryData()
    } else {
      fetchStatisticsData()
    }
  }, [activeTab, selectedGovernorate, selectedGovernorateId, selectedProduct, selectedCategory, selectedYear, dateRange, timeGroup])

  const fetchFilters = async () => {
    try {
      setLoadingFilters(true)
      const [productsRes, categoriesRes] = await Promise.all([
        adminService.getProducts().catch(() => ({ data: [] })),
        adminService.getCategories().catch(() => ({ data: [] }))
      ])
      
      setProducts(productsRes.data || productsRes.data || [])
      setCategories(categoriesRes.data || categoriesRes.data || [])
      
      // Try to get governorates from market analysis service
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

  const buildParams = () => {
    const params = {}
    if (selectedGovernorate) params.governorate = selectedGovernorate
    if (selectedGovernorateId) params.governorateId = selectedGovernorateId
    if (selectedProduct) params.productId = selectedProduct
    if (selectedCategory) params.categoryId = selectedCategory
    if (selectedYear) params.year = selectedYear
    if (dateRange.startDate) params.startDate = dateRange.startDate
    if (dateRange.endDate) params.endDate = dateRange.endDate
    if (timeGroup) params.timeGroup = timeGroup
    return params
  }

  const fetchMinistryData = async () => {
    const params = buildParams()
    
    const promises = [
      fetchMonthlyMarketFlow(params),
      fetchStorageCapacity(params),
      fetchCurrentMonthFlow(params),
      fetchStorageUsageRate(params),
      fetchTotalStorageCapacity(params),
      fetchStorageTypesDistribution(params)
    ]
    
    await Promise.allSettled(promises)
  }

  const fetchStatisticsData = async () => {
    const params = buildParams()
    
    const promises = [
      fetchUserAgeGroup(params),
      fetchUserType(params),
      fetchUserActivity(params),
      fetchUserByGovernorate(params),
      fetchProductionByProduct(params),
      fetchProductByCategory(params),
      fetchSeasonalProduction(params)
    ]
    
    await Promise.allSettled(promises)
  }

  // Ministry API calls
  const fetchMonthlyMarketFlow = async (params) => {
    try {
      setLoading(prev => ({ ...prev, monthlyMarketFlow: true }))
      const response = await reportsService.getMonthlyMarketFlow(params)
      setMonthlyMarketFlow(response.data || response)
      setErrors(prev => ({ ...prev, monthlyMarketFlow: null }))
    } catch (error) {
      console.error('Failed to fetch monthly market flow:', error)
      setErrors(prev => ({ ...prev, monthlyMarketFlow: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, monthlyMarketFlow: false }))
    }
  }

  const fetchStorageCapacity = async (params) => {
    try {
      setLoading(prev => ({ ...prev, storageCapacity: true }))
      const response = await reportsService.getStorageCapacityByGovernorate(params)
      setStorageCapacity(response.data || response)
      setErrors(prev => ({ ...prev, storageCapacity: null }))
    } catch (error) {
      console.error('Failed to fetch storage capacity:', error)
      setErrors(prev => ({ ...prev, storageCapacity: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, storageCapacity: false }))
    }
  }

  const fetchCurrentMonthFlow = async (params) => {
    try {
      setLoading(prev => ({ ...prev, currentMonthFlow: true }))
      const response = await reportsService.getCurrentMonthMarketFlow(params)
      setCurrentMonthFlow(response.data || response)
      setErrors(prev => ({ ...prev, currentMonthFlow: null }))
    } catch (error) {
      console.error('Failed to fetch current month flow:', error)
      setErrors(prev => ({ ...prev, currentMonthFlow: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, currentMonthFlow: false }))
    }
  }

  const fetchStorageUsageRate = async (params) => {
    try {
      setLoading(prev => ({ ...prev, storageUsageRate: true }))
      const response = await reportsService.getStorageUsageRate(params)
      setStorageUsageRate(response.data || response)
      setErrors(prev => ({ ...prev, storageUsageRate: null }))
    } catch (error) {
      console.error('Failed to fetch storage usage rate:', error)
      setErrors(prev => ({ ...prev, storageUsageRate: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, storageUsageRate: false }))
    }
  }

  const fetchTotalStorageCapacity = async (params) => {
    try {
      setLoading(prev => ({ ...prev, totalStorageCapacity: true }))
      const response = await reportsService.getTotalStorageCapacity(params)
      setTotalStorageCapacity(response.data || response)
      setErrors(prev => ({ ...prev, totalStorageCapacity: null }))
    } catch (error) {
      console.error('Failed to fetch total storage capacity:', error)
      setErrors(prev => ({ ...prev, totalStorageCapacity: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, totalStorageCapacity: false }))
    }
  }

  const fetchStorageTypesDistribution = async (params) => {
    try {
      setLoading(prev => ({ ...prev, storageTypesDistribution: true }))
      const response = await reportsService.getStorageTypesDistribution(params)
      setStorageTypesDistribution(response.data || response)
      setErrors(prev => ({ ...prev, storageTypesDistribution: null }))
    } catch (error) {
      console.error('Failed to fetch storage types distribution:', error)
      setErrors(prev => ({ ...prev, storageTypesDistribution: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, storageTypesDistribution: false }))
    }
  }

  // Statistics API calls
  const fetchUserAgeGroup = async (params) => {
    try {
      setLoading(prev => ({ ...prev, userAgeGroup: true }))
      const response = await reportsService.getUserDistributionByAgeGroup(params)
      setUserAgeGroup(response.data || response)
      setErrors(prev => ({ ...prev, userAgeGroup: null }))
    } catch (error) {
      console.error('Failed to fetch user age group:', error)
      setErrors(prev => ({ ...prev, userAgeGroup: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, userAgeGroup: false }))
    }
  }

  const fetchUserType = async (params) => {
    try {
      setLoading(prev => ({ ...prev, userType: true }))
      const response = await reportsService.getUserDistributionByType(params)
      setUserType(response.data || response)
      setErrors(prev => ({ ...prev, userType: null }))
    } catch (error) {
      console.error('Failed to fetch user type:', error)
      setErrors(prev => ({ ...prev, userType: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, userType: false }))
    }
  }

  const fetchUserActivity = async (params) => {
    try {
      setLoading(prev => ({ ...prev, userActivity: true }))
      const response = await reportsService.getUserActivity(params)
      setUserActivity(response.data || response)
      setErrors(prev => ({ ...prev, userActivity: null }))
    } catch (error) {
      console.error('Failed to fetch user activity:', error)
      setErrors(prev => ({ ...prev, userActivity: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, userActivity: false }))
    }
  }

  const fetchUserByGovernorate = async (params) => {
    try {
      setLoading(prev => ({ ...prev, userByGovernorate: true }))
      const response = await reportsService.getUserDistributionByGovernorate(params)
      setUserByGovernorate(response.data || response)
      setErrors(prev => ({ ...prev, userByGovernorate: null }))
    } catch (error) {
      console.error('Failed to fetch user by governorate:', error)
      setErrors(prev => ({ ...prev, userByGovernorate: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, userByGovernorate: false }))
    }
  }

  const fetchProductionByProduct = async (params) => {
    try {
      setLoading(prev => ({ ...prev, productionByProduct: true }))
      const response = await reportsService.getProductionQuantitiesByProduct(params)
      setProductionByProduct(response.data || response)
      setErrors(prev => ({ ...prev, productionByProduct: null }))
    } catch (error) {
      console.error('Failed to fetch production by product:', error)
      setErrors(prev => ({ ...prev, productionByProduct: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, productionByProduct: false }))
    }
  }

  const fetchProductByCategory = async (params) => {
    try {
      setLoading(prev => ({ ...prev, productByCategory: true }))
      const response = await reportsService.getProductDistributionByCategory(params)
      setProductByCategory(response.data || response)
      setErrors(prev => ({ ...prev, productByCategory: null }))
    } catch (error) {
      console.error('Failed to fetch product by category:', error)
      setErrors(prev => ({ ...prev, productByCategory: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, productByCategory: false }))
    }
  }

  const fetchSeasonalProduction = async (params) => {
    try {
      setLoading(prev => ({ ...prev, seasonalProduction: true }))
      const response = await reportsService.getSeasonalProduction(params)
      setSeasonalProduction(response.data || response)
      setErrors(prev => ({ ...prev, seasonalProduction: null }))
    } catch (error) {
      console.error('Failed to fetch seasonal production:', error)
      setErrors(prev => ({ ...prev, seasonalProduction: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, seasonalProduction: false }))
    }
  }

  // Data formatting functions
  const formatMonthlyMarketFlowData = (data) => {
    if (!data || !data.incoming || !data.outgoing) return []
    
    const periods = new Set()
    data.incoming.forEach(item => periods.add(item.period))
    data.outgoing.forEach(item => periods.add(item.period))
    
    return Array.from(periods).sort().map(period => {
      const incoming = data.incoming.find(item => item.period === period) || { quantity: 0, count: 0 }
      const outgoing = data.outgoing.find(item => item.period === period) || { quantity: 0, count: 0 }
      return {
        period,
        incoming: incoming.quantity || 0,
        outgoing: outgoing.quantity || 0,
        netFlow: (incoming.quantity || 0) - (outgoing.quantity || 0)
      }
    })
  }

  const formatStorageCapacityData = (data) => {
    if (!data || !data.storageData) return []
    return data.storageData.map(item => ({
      governorate: item.governorate,
      totalCapacity: item.totalCapacity || 0,
      actualUsage: item.actualUsage || 0,
      usagePercentage: item.usagePercentage || 0,
      availableCapacity: (item.totalCapacity || 0) - (item.actualUsage || 0)
    }))
  }

  const formatStorageTypesData = (data) => {
    if (!data || !data.distribution) return []
    return data.distribution.map(item => ({
      name: item.storageType,
      value: item.count || 0,
      percentage: item.percentage || 0,
      capacity: item.totalCapacity || 0
    }))
  }

  const formatUserAgeGroupData = (data) => {
    if (!data || !data.distribution) return []
    return data.distribution.map(item => ({
      name: item.ageGroup,
      value: item.count || 0,
      percentage: item.percentage || 0
    }))
  }

  const formatUserTypeData = (data) => {
    if (!data || !data.distribution) return []
    return data.distribution.map(item => ({
      name: item.userType,
      value: item.count || 0,
      percentage: item.percentage || 0
    }))
  }

  const formatUserActivityData = (data) => {
    if (!data || !data.newUsers || !data.activeUsers) return []
    
    const periods = new Set()
    data.newUsers.forEach(item => periods.add(item.period))
    data.activeUsers.forEach(item => periods.add(item.period))
    
    return Array.from(periods).sort().map(period => {
      const newUsers = data.newUsers.find(item => item.period === period) || { newUsers: 0 }
      const activeUsers = data.activeUsers.find(item => item.period === period) || { activeUsers: 0 }
      return {
        period,
        newUsers: newUsers.newUsers || 0,
        activeUsers: activeUsers.activeUsers || 0
      }
    })
  }

  const formatUserByGovernorateData = (data) => {
    if (!data || !data.distribution) return []
    return data.distribution.map(item => ({
      name: item.governorate,
      value: item.count || 0,
      percentage: item.percentage || 0
    }))
  }

  const formatProductionByProductData = (data) => {
    if (!data || !data.production) return []
    return data.production.slice(0, 10).map(item => ({
      name: item.productNameEn || item.productNameAr || `Product ${item.productId}`,
      quantity: item.totalQuantity || 0,
      transactions: item.transactionCount || 0,
      avgPrice: item.averagePrice || 0
    }))
  }

  const formatProductByCategoryData = (data) => {
    if (!data || !data.distribution) return []
    return data.distribution.map(item => ({
      name: item.categoryNameEn || item.categoryNameAr || `Category ${item.categoryId}`,
      quantity: item.totalQuantity || 0,
      value: item.totalValue || 0,
      quantityPercentage: item.quantityPercentage || 0,
      valuePercentage: item.valuePercentage || 0,
      productCount: item.productCount || 0
    }))
  }

  const formatSeasonalProductionData = (data) => {
    if (!data || !data.monthlyProduction) return []
    return data.monthlyProduction.map(item => ({
      month: item.monthName || `Month ${item.month}`,
      totalQuantity: item.totalQuantity || 0,
      categories: item.categories || []
    }))
  }

  const handleRefresh = () => {
    if (activeTab === 'ministry') {
      fetchMinistryData()
    } else {
      fetchStatisticsData()
    }
  }

  // Format dates for API (ISO 8601)
  const formatDateForAPI = (dateString) => {
    if (!dateString) return null
    // If dateString is already in YYYY-MM-DD format, append time for UTC
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `${dateString}T00:00:00Z`
    }
    const date = new Date(dateString)
    return date.toISOString()
  }

  const handleDateChange = (type, value) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value ? formatDateForAPI(value) : null
    }))
  }

  // Chart data
  const monthlyMarketFlowChartData = formatMonthlyMarketFlowData(monthlyMarketFlow)
  const storageCapacityChartData = formatStorageCapacityData(storageCapacity)
  const storageTypesChartData = formatStorageTypesData(storageTypesDistribution)
  const userAgeGroupChartData = formatUserAgeGroupData(userAgeGroup)
  const userTypeChartData = formatUserTypeData(userType)
  const userActivityChartData = formatUserActivityData(userActivity)
  const userByGovernorateChartData = formatUserByGovernorateData(userByGovernorate)
  const productionByProductChartData = formatProductionByProductData(productionByProduct)
  const productByCategoryChartData = formatProductByCategoryData(productByCategory)
  const seasonalProductionChartData = formatSeasonalProductionData(seasonalProduction)

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('reports.title')}</h1>
          <p className="page-subtitle">{t('reports.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleRefresh}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        <button 
          className={`tab-button ${activeTab === 'ministry' ? 'active' : ''}`}
          onClick={() => setActiveTab('ministry')}
        >
          <FiDatabase /> {t('reports.ministryReports')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          <FiBarChart2 /> {t('reports.statisticsReports')}
        </button>
      </div>

      {/* Filters Panel */}
      <div className="filters-panel card">
        <div className="filters-header">
          <h3><FiFilter /> {t('common.filter')}</h3>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label>{t('reports.governorate')}</label>
            <select 
              className="filter-select"
              value={selectedGovernorate || ''}
              onChange={(e) => {
                setSelectedGovernorate(e.target.value || null)
                setSelectedGovernorateId(null)
              }}
              disabled={loadingFilters}
            >
              <option value="">{t('reports.allGovernorates')}</option>
              {governorates.map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('reports.product')}</label>
            <select 
              className="filter-select"
              value={selectedProduct || ''}
              onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingFilters}
            >
              <option value="">{t('reports.allProducts')}</option>
              {products.map(product => (
                <option key={product.productId} value={product.productId}>
                  {product.nameEn || product.nameAr || `Product ${product.productId}`}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('reports.category')}</label>
            <select 
              className="filter-select"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingFilters}
            >
              <option value="">{t('reports.allCategories')}</option>
              {categories.map(cat => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.nameEn || cat.nameAr || `Category ${cat.categoryId}`}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('reports.year')}</label>
            <input 
              type="number"
              className="filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              min="2020"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="filter-group">
            <label>{t('reports.startDate')}</label>
            <input 
              type="date"
              className="filter-select"
              value={dateRange.startDate ? dateRange.startDate.split('T')[0] : ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>{t('reports.endDate')}</label>
            <input 
              type="date"
              className="filter-select"
              value={dateRange.endDate ? dateRange.endDate.split('T')[0] : ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>{t('reports.timeGroup')}</label>
            <select 
              className="filter-select"
              value={timeGroup}
              onChange={(e) => setTimeGroup(e.target.value)}
            >
              <option value="minute">{t('reports.minute')}</option>
              <option value="hour">{t('reports.hour')}</option>
              <option value="day">{t('reports.day')}</option>
              <option value="week">{t('reports.week')}</option>
              <option value="month">{t('reports.month')}</option>
              <option value="year">{t('reports.year')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ministry Reports */}
      {activeTab === 'ministry' && (
        <div className="reports-content">
          {/* Summary Cards */}
          {totalStorageCapacity && (
            <div className="stats-grid">
              <StatCard
                title={t('reports.totalStorageCapacity')}
                value={`${(totalStorageCapacity.totalCapacity || 0).toLocaleString()} ${t('reports.tons')}`}
                icon={<FiDatabase />}
                color="primary"
              />
              {storageUsageRate && (
                <StatCard
                  title={t('reports.storageUsageRate')}
                  value={`${(storageUsageRate.usageRatePercentage || 0).toFixed(1)}%`}
                  icon={<FiActivity />}
                  color="warning"
                />
              )}
              {currentMonthFlow && (
                <StatCard
                  title={t('reports.currentMonthFlow')}
                  value={`${(currentMonthFlow.currentPeriod?.quantity || 0).toLocaleString()} ${t('reports.tons')}`}
                  change={currentMonthFlow.percentageChange}
                  icon={<FiTrendingUp />}
                  color={currentMonthFlow.percentageChange >= 0 ? 'success' : 'danger'}
                />
              )}
              {monthlyMarketFlow?.summary && (
                <StatCard
                  title={t('reports.monthlyMarketFlow')}
                  value={`${(monthlyMarketFlow.summary.netFlow || 0).toLocaleString()} ${t('reports.tons')}`}
                  icon={<FiBarChart2 />}
                  color="info"
                />
              )}
            </div>
          )}

          {/* Monthly Market Flow Chart */}
          {monthlyMarketFlowChartData.length > 0 && (
            <Chart
              type="composed"
              data={monthlyMarketFlowChartData}
              dataKeys={[
                { dataKey: 'incoming', name: t('reports.incoming'), type: 'bar', color: '#10b981' },
                { dataKey: 'outgoing', name: t('reports.outgoing'), type: 'bar', color: '#ef4444' },
                { dataKey: 'netFlow', name: t('reports.netFlow'), type: 'line', color: '#6366f1' }
              ]}
              xAxisKey="period"
              title={t('reports.monthlyMarketFlow')}
              height={400}
              yAxisLabel={t('reports.quantity')}
              tooltipFormatter={(value, name) => [`${value.toLocaleString()} ${t('reports.tons')}`, name]}
            />
          )}

          {/* Current Month Flow Card */}
          {currentMonthFlow && (
            <div className="info-card card">
              <h3>{t('reports.currentMonthFlow')}</h3>
              <div className="info-grid">
                <div>
                  <p className="info-label">{t('reports.currentPeriod')}</p>
                  <p className="info-value">{currentMonthFlow.currentPeriod?.quantity?.toLocaleString() || 0} {t('reports.tons')}</p>
                </div>
                <div>
                  <p className="info-label">{t('reports.previousPeriod')}</p>
                  <p className="info-value">{currentMonthFlow.previousPeriod?.quantity?.toLocaleString() || 0} {t('reports.tons')}</p>
                </div>
                <div>
                  <p className="info-label">{t('reports.change')}</p>
                  <p className={`info-value ${currentMonthFlow.percentageChange >= 0 ? 'positive' : 'negative'}`}>
                    {currentMonthFlow.percentageChange >= 0 ? '+' : ''}{currentMonthFlow.percentageChange?.toFixed(2) || 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Storage Capacity by Governorate */}
          {storageCapacityChartData.length > 0 && (
            <Chart
              type="bar"
              data={storageCapacityChartData}
              dataKeys={[
                { dataKey: 'totalCapacity', name: t('reports.totalCapacity'), color: '#6366f1' },
                { dataKey: 'actualUsage', name: t('reports.actualUsage'), color: '#10b981' },
                { dataKey: 'availableCapacity', name: t('reports.available'), color: '#94a3b8' }
              ]}
              xAxisKey="governorate"
              title={t('reports.storageCapacity')}
              height={400}
              yAxisLabel={t('reports.quantity')}
              tooltipFormatter={(value) => `${value.toLocaleString()} ${t('reports.tons')}`}
            />
          )}

          {/* Storage Usage Rate */}
          {storageUsageRate && (
            <div className="info-card card">
              <h3>{t('reports.storageUsageRate')}</h3>
              <div className="usage-stats">
                <div className="usage-item">
                  <p className="usage-label">{t('reports.totalCapacity')}</p>
                  <p className="usage-value">{storageUsageRate.totalCapacity?.toLocaleString() || 0} {t('reports.tons')}</p>
                </div>
                <div className="usage-item">
                  <p className="usage-label">{t('reports.actualUsage')}</p>
                  <p className="usage-value">{storageUsageRate.actualUsage?.toLocaleString() || 0} {t('reports.tons')}</p>
                </div>
                <div className="usage-item">
                  <p className="usage-label">{t('reports.availableCapacity')}</p>
                  <p className="usage-value">{storageUsageRate.availableCapacity?.toLocaleString() || 0} {t('reports.tons')}</p>
                </div>
                <div className="usage-item">
                  <p className="usage-label">{t('reports.usageRate')}</p>
                  <p className="usage-value highlight">{storageUsageRate.usageRatePercentage?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Storage Types Distribution */}
          {storageTypesChartData.length > 0 && (
            <div className="charts-grid">
              <Chart
                type="pie"
                data={storageTypesChartData}
                dataKey="value"
                title={t('reports.storageTypesDistribution')}
                height={350}
                pieLabel={true}
                tooltipFormatter={(value, name, props) => [
                  `${value} ${t('reports.facilities')} (${props.payload.percentage?.toFixed(1)}%)`,
                  name
                ]}
              />
              <Chart
                type="bar"
                data={storageTypesChartData}
                dataKey="capacity"
                xAxisKey="name"
                title={t('reports.storageTypesCapacity')}
                height={350}
                yAxisLabel={t('reports.quantity')}
                tooltipFormatter={(value) => `${value.toLocaleString()} ${t('reports.tons')}`}
              />
            </div>
          )}
        </div>
      )}

      {/* Statistics Reports */}
      {activeTab === 'statistics' && (
        <div className="reports-content">
          {/* Summary Cards */}
          {userActivity?.summary && (
            <div className="stats-grid">
              <StatCard
                title={t('reports.totalNewUsers')}
                value={(userActivity.summary.totalNewUsers || 0).toLocaleString()}
                icon={<FiUsers />}
                color="success"
              />
              <StatCard
                title={t('reports.totalActiveUsers')}
                value={(userActivity.summary.totalActiveUsers || 0).toLocaleString()}
                icon={<FiActivity />}
                color="primary"
              />
              <StatCard
                title={t('reports.avgNewUsers')}
                value={(userActivity.summary.averageNewUsersPerPeriod || 0).toFixed(0)}
                icon={<FiTrendingUp />}
                color="info"
              />
              {productionByProduct?.summary && (
                <StatCard
                  title={t('reports.totalProduction')}
                  value={`${(productionByProduct.summary.totalQuantity || 0).toLocaleString()} ${t('reports.tons')}`}
                  icon={<FiPackage />}
                  color="warning"
                />
              )}
            </div>
          )}

          {/* User Activity Chart */}
          {userActivityChartData.length > 0 && (
            <Chart
              type="composed"
              data={userActivityChartData}
              dataKeys={[
                { dataKey: 'newUsers', name: t('reports.newUsers'), type: 'bar', color: '#10b981' },
                { dataKey: 'activeUsers', name: t('reports.activeUsers'), type: 'line', color: '#6366f1' }
              ]}
              xAxisKey="period"
              title={t('reports.userActivity')}
              height={400}
              yAxisLabel={t('reports.numberOfUsers')}
              tooltipFormatter={(value) => value.toLocaleString()}
            />
          )}

          {/* User Distribution Charts */}
          <div className="charts-grid">
            {userAgeGroupChartData.length > 0 && (
              <Chart
                type="pie"
                data={userAgeGroupChartData}
                dataKey="value"
                title={t('reports.userAgeGroup')}
                height={350}
                pieLabel={true}
                tooltipFormatter={(value, name, props) => [
                  `${value} ${t('common.users')} (${props.payload.percentage?.toFixed(1)}%)`,
                  name
                ]}
              />
            )}

            {userTypeChartData.length > 0 && (
              <Chart
                type="pie"
                data={userTypeChartData}
                dataKey="value"
                title={t('reports.userType')}
                height={350}
                pieLabel={true}
                tooltipFormatter={(value, name, props) => [
                  `${value} ${t('common.users')} (${props.payload.percentage?.toFixed(1)}%)`,
                  name
                ]}
              />
            )}
          </div>

          {/* User Distribution by Governorate */}
          {userByGovernorateChartData.length > 0 && (
            <Chart
              type="bar"
              data={userByGovernorateChartData}
              dataKey="value"
              xAxisKey="name"
              title={t('reports.userByGovernorate')}
              height={400}
              yAxisLabel={t('reports.numberOfUsers')}
              tooltipFormatter={(value, name, props) => [
                `${value.toLocaleString()} users (${props.payload.percentage?.toFixed(1)}%)`,
                name
              ]}
            />
          )}

          {/* Production by Product */}
          {productionByProductChartData.length > 0 && (
            <Chart
              type="bar"
              data={productionByProductChartData}
              dataKey="quantity"
              xAxisKey="name"
              title={t('reports.productionByProduct')}
              height={400}
              yAxisLabel={t('reports.quantity')}
              tooltipFormatter={(value, name, props) => [
                `${value.toLocaleString()} ${t('reports.tons')} (${props.payload.transactions} ${t('reports.transactions')})`,
                name
              ]}
            />
          )}

          {/* Product Distribution by Category */}
          {productByCategoryChartData.length > 0 && (
            <div className="charts-grid">
              <Chart
                type="bar"
                data={productByCategoryChartData}
                dataKey="quantity"
                xAxisKey="name"
                title={t('reports.productByCategory')}
                height={350}
                yAxisLabel={t('reports.quantity')}
                tooltipFormatter={(value, name, props) => [
                  `${value.toLocaleString()} ${t('reports.tons')} (${props.payload.quantityPercentage?.toFixed(1)}%)`,
                  name
                ]}
              />
              <Chart
                type="pie"
                data={productByCategoryChartData}
                dataKey="quantityPercentage"
                title={t('reports.productByCategory')}
                height={350}
                pieLabel={true}
                tooltipFormatter={(value, name, props) => [
                  `${value.toFixed(1)}% (${props.payload.quantity?.toLocaleString()} ${t('reports.tons')})`,
                  name
                ]}
              />
            </div>
          )}

          {/* Seasonal Production */}
          {seasonalProductionChartData.length > 0 && (
            <Chart
              type="bar"
              data={seasonalProductionChartData}
              dataKey="totalQuantity"
              xAxisKey="month"
              title={`${t('reports.seasonalProduction')} ${seasonalProduction?.year || selectedYear}`}
              height={400}
              yAxisLabel={t('reports.quantity')}
              tooltipFormatter={(value) => `${value.toLocaleString()} ${t('reports.tons')}`}
            />
          )}
        </div>
      )}

      {/* Loading States */}
      {Object.values(loading).some(v => v) && (
        <div className="loading-overlay">
          <p>{t('reports.loadingReports')}</p>
        </div>
      )}

      {/* Error Messages */}
      {Object.entries(errors).map(([key, error]) => error && (
        <div key={key} className="error-message card">
          <p>Error loading {key}: {error}</p>
        </div>
      ))}
    </div>
  )
}

export default Reports

