import apiClient from './api';

/**
 * Market Analysis Service
 * Handles all market analysis and chart data API calls
 */

export const marketAnalysisService = {
  // Dashboard Summary
  getDashboardSummary: async (governorate) => {
    const params = {};
    if (governorate) params.governorate = governorate;
    return apiClient.get('/api/MarketAnalysis/charts/dashboard-summary', params);
  },

  // Price Trends Chart
  getPriceTrends: async (params = {}) => {
    const filteredParams = {};
    if (params.productId) filteredParams.productId = params.productId;
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.startDate) filteredParams.startDate = params.startDate;
    if (params.endDate) filteredParams.endDate = params.endDate;
    if (params.groupBy) filteredParams.groupBy = params.groupBy;

    return apiClient.get('/api/MarketAnalysis/charts/price-trends', filteredParams);
  },

  // Volume by Governorate Chart
  getVolumeByGovernorate: async (params = {}) => {
    const filteredParams = {};
    if (params.productId) filteredParams.productId = params.productId;
    if (params.startDate) filteredParams.startDate = params.startDate;
    if (params.endDate) filteredParams.endDate = params.endDate;
    return apiClient.get('/api/MarketAnalysis/charts/volume-by-governorate', filteredParams);
  },

  // Transaction Type Distribution
  getTransactionTypeDistribution: async (params = {}) => {
    const { governorate, startDate, endDate } = params;
    return apiClient.get('/api/MarketAnalysis/charts/transaction-type-distribution', {
      governorate,
      startDate,
      endDate
    });
  },

  // Top Products by Revenue
  getTopProductsByRevenue: async (params = {}) => {
    const { governorate, startDate, endDate, topN = 10 } = params;
    return apiClient.get('/api/MarketAnalysis/charts/top-products-by-revenue', {
      governorate,
      startDate,
      endDate,
      topN
    });
  },

  // Price Comparison by Governorate
  getPriceComparisonByGovernorate: async (params = {}) => {
    const { productId, date } = params;
    return apiClient.get('/api/MarketAnalysis/charts/price-comparison-by-governorate', {
      productId,
      date
    });
  },

  // Sales Heatmap
  getSalesHeatmap: async (params = {}) => {
    const { productId, governorate, year } = params;
    return apiClient.get('/api/MarketAnalysis/charts/sales-heatmap', {
      productId,
      governorate,
      year
    });
  },

  // Supply-Demand Trends
  getSupplyDemandTrends: async (params = {}) => {
    const { productId, governorate, days = 30 } = params;
    return apiClient.get('/api/MarketAnalysis/charts/supply-demand-trends', {
      productId,
      governorate,
      days
    });
  },

  // Market Share by Product
  getMarketShareByProduct: async (params = {}) => {
    const { governorate, startDate, endDate } = params;
    return apiClient.get('/api/MarketAnalysis/charts/market-share-by-product', {
      governorate,
      startDate,
      endDate
    });
  },

  // Daily Sales Sparkline
  getDailySalesSparkline: async (params = {}) => {
    const { productId, governorate, days = 7 } = params;
    return apiClient.get('/api/MarketAnalysis/charts/daily-sales-sparkline', {
      productId,
      governorate,
      days
    });
  },

  // Price Volatility
  getPriceVolatility: async (params = {}) => {
    const {
      productId,
      governorate,
      startDate,
      endDate,
      groupBy = 'day'
    } = params;
    return apiClient.get('/api/MarketAnalysis/charts/price-volatility', {
      productId,
      governorate,
      startDate,
      endDate,
      groupBy
    });
  },

  // Comprehensive Analysis
  getComprehensiveAnalysis: async (params = {}) => {
    const {
      governorate,
      productId,
      productName,
      startDate,
      endDate,
      analysisType
    } = params;
    return apiClient.get('/api/MarketAnalysis/comprehensive-analysis', {
      Governorate: governorate,
      ProductId: productId,
      ProductName: productName,
      StartDate: startDate,
      EndDate: endDate,
      AnalysisType: analysisType
    });
  },

  // Market Trends
  getMarketTrends: async (params = {}) => {
    const { governorate, productId, days = 30 } = params;
    return apiClient.get('/api/MarketAnalysis/market-trends', {
      governorate,
      productId,
      days
    });
  },

  // Top Products
  getTopProducts: async (params = {}) => {
    const { governorate, topN = 10 } = params;
    return apiClient.get('/api/MarketAnalysis/top-products', {
      governorate,
      topN
    });
  },

  // Price Forecast
  getPriceForecast: async (params = {}) => {
    const { productId, governorate, forecastDays = 30 } = params;
    return apiClient.get('/api/MarketAnalysis/price-forecast', {
      productId,
      governorate,
      forecastDays
    });
  },

  // ===== FILTER ENDPOINTS =====

  // Get Available Filters
  getAvailableFilters: async () => {
    return apiClient.get('/api/MarketAnalysis/filters/available');
  },

  // Validate Filter Parameters
  validateFilters: async (filters) => {
    return apiClient.post('/api/MarketAnalysis/filters/validate', filters);
  },

  // ===== DATA BACKFILL =====

  // Backfill Sales Transactions
  backfillSalesTransactions: async () => {
    return apiClient.post('/api/MarketAnalysis/backfill/sales-transactions');
  },
};

export default marketAnalysisService;

