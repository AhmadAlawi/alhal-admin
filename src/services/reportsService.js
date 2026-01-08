import apiClient from './api';

/**
 * Comprehensive Reports Service
 * Handles all 40+ Reports API endpoints covering all aspects of the platform
 */

// Helper function to build filtered params
const buildParams = (params = {}) => {
  const filteredParams = {};
  const paramKeys = [
    'startDate', 'endDate', 'timeGroup', 'governorate', 'governorateId', 
    'cityId', 'areaId', 'productId', 'categoryId', 'subCategoryId',
    'userId', 'userType', 'isVerified', 'status', 'transportProviderId',
    'fromArea', 'toArea', 'tenderId', 'auctionId', 'page', 'pageSize',
    'sortBy', 'sortOrder', 'year'
  ];
  
  paramKeys.forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      filteredParams[key] = params[key];
    }
  });
  
  return filteredParams;
};

const reportsService = {
  // ===== SALES REPORTS (5 reports) =====
  
  getSalesReport: async (params = {}) => {
    return apiClient.get('/api/reports/sales', buildParams(params));
  },

  getSalesByProduct: async (params = {}) => {
    return apiClient.get('/api/reports/sales/by-product', buildParams(params));
  },

  getSalesByCategory: async (params = {}) => {
    return apiClient.get('/api/reports/sales/by-category', buildParams(params));
  },

  getSalesByLocation: async (params = {}) => {
    return apiClient.get('/api/reports/sales/by-location', buildParams(params));
  },

  getSalesTrends: async (params = {}) => {
    return apiClient.get('/api/reports/sales/trends', buildParams(params));
  },

  // ===== USER REPORTS (5 reports) =====

  getUserActivity: async (params = {}) => {
    return apiClient.get('/api/reports/users/activity', buildParams(params));
  },

  getUserRegistrations: async (params = {}) => {
    return apiClient.get('/api/reports/users/registrations', buildParams(params));
  },

  getUserTypeDistribution: async (params = {}) => {
    return apiClient.get('/api/reports/users/by-type', buildParams(params));
  },

  getUserLocation: async (params = {}) => {
    return apiClient.get('/api/reports/users/by-location', buildParams(params));
  },

  getUserPerformance: async (params = {}) => {
    return apiClient.get('/api/reports/users/performance', buildParams(params));
  },

  // ===== PRODUCT REPORTS (5 reports) =====

  getProductPerformance: async (params = {}) => {
    return apiClient.get('/api/reports/products/performance', buildParams(params));
  },

  getProductInventory: async (params = {}) => {
    return apiClient.get('/api/reports/products/inventory', buildParams(params));
  },

  getProductPriceTrends: async (params = {}) => {
    return apiClient.get('/api/reports/products/price-trends', buildParams(params));
  },

  getTopProducts: async (params = {}) => {
    return apiClient.get('/api/reports/products/top', buildParams(params));
  },

  getProductCategory: async (params = {}) => {
    return apiClient.get('/api/reports/products/by-category', buildParams(params));
  },

  // ===== TRANSPORT REPORTS (5 reports) =====

  getTransportActivity: async (params = {}) => {
    return apiClient.get('/api/reports/transport/activity', buildParams(params));
  },

  getTransportProviders: async (params = {}) => {
    return apiClient.get('/api/reports/transport/providers', buildParams(params));
  },

  getTransportRoutes: async (params = {}) => {
    return apiClient.get('/api/reports/transport/routes', buildParams(params));
  },

  getTransportRevenue: async (params = {}) => {
    return apiClient.get('/api/reports/transport/revenue', buildParams(params));
  },

  getTransportRatings: async (params = {}) => {
    return apiClient.get('/api/reports/transport/ratings', buildParams(params));
  },

  // ===== TENDER REPORTS (4 reports) =====

  getTenderActivity: async (params = {}) => {
    return apiClient.get('/api/reports/tenders/activity', buildParams(params));
  },

  getTenderPerformance: async (params = {}) => {
    return apiClient.get('/api/reports/tenders/performance', buildParams(params));
  },

  getTenderOffers: async (params = {}) => {
    return apiClient.get('/api/reports/tenders/offers', buildParams(params));
  },

  getTenderAwards: async (params = {}) => {
    return apiClient.get('/api/reports/tenders/awards', buildParams(params));
  },

  // ===== AUCTION REPORTS (3 reports) =====

  getAuctionActivity: async (params = {}) => {
    return apiClient.get('/api/reports/auctions/activity', buildParams(params));
  },

  getAuctionBids: async (params = {}) => {
    return apiClient.get('/api/reports/auctions/bids', buildParams(params));
  },

  getAuctionRevenue: async (params = {}) => {
    return apiClient.get('/api/reports/auctions/revenue', buildParams(params));
  },

  // ===== FINANCIAL REPORTS (4 reports) =====

  getRevenue: async (params = {}) => {
    return apiClient.get('/api/reports/financial/revenue', buildParams(params));
  },

  getPaymentMethods: async (params = {}) => {
    return apiClient.get('/api/reports/financial/payment-methods', buildParams(params));
  },

  getTransactions: async (params = {}) => {
    return apiClient.get('/api/reports/financial/transactions', buildParams(params));
  },

  getProfitLoss: async (params = {}) => {
    return apiClient.get('/api/reports/financial/profit-loss', buildParams(params));
  },

  // ===== INVENTORY REPORTS (4 reports) =====

  getInventoryLevels: async (params = {}) => {
    return apiClient.get('/api/reports/inventory/levels', buildParams(params));
  },

  getInventoryMovements: async (params = {}) => {
    return apiClient.get('/api/reports/inventory/movements', buildParams(params));
  },

  getStockBalance: async (params = {}) => {
    return apiClient.get('/api/reports/inventory/stock-balance', buildParams(params));
  },

  getWarehouses: async (params = {}) => {
    return apiClient.get('/api/reports/inventory/warehouses', buildParams(params));
  },

  // ===== PERFORMANCE REPORTS (3 reports) =====

  getSystemPerformance: async (params = {}) => {
    return apiClient.get('/api/reports/performance/system', buildParams(params));
  },

  getConversionRate: async (params = {}) => {
    return apiClient.get('/api/reports/performance/conversion', buildParams(params));
  },

  getRetention: async (params = {}) => {
    return apiClient.get('/api/reports/performance/retention', buildParams(params));
  },

  // ===== MARKET ANALYSIS REPORTS (3 reports) =====

  getMarketTrends: async (params = {}) => {
    return apiClient.get('/api/reports/market/trends', buildParams(params));
  },

  getPriceComparison: async (params = {}) => {
    return apiClient.get('/api/reports/market/price-comparison', buildParams(params));
  },

  getSupplyDemand: async (params = {}) => {
    return apiClient.get('/api/reports/market/supply-demand', buildParams(params));
  },

  // ===== LOSS REPORTS (3 reports) =====

  getLosses: async (params = {}) => {
    return apiClient.get('/api/reports/losses', buildParams(params));
  },

  getLossesByProduct: async (params = {}) => {
    return apiClient.get('/api/reports/losses/by-product', buildParams(params));
  },

  getLossesByLocation: async (params = {}) => {
    return apiClient.get('/api/reports/losses/by-location', buildParams(params));
  },

  // ===== LEGACY MINISTRY REPORTS (for backward compatibility) =====

  getMonthlyMarketFlow: async (params = {}) => {
    return apiClient.get('/api/reports/ministry/market-flow/monthly', buildParams(params));
  },

  getStorageCapacityByGovernorate: async (params = {}) => {
    return apiClient.get('/api/reports/ministry/storage-capacity/by-governorate', buildParams(params));
  },

  getCurrentMonthMarketFlow: async (params = {}) => {
    return apiClient.get('/api/reports/ministry/market-flow/current-month', buildParams(params));
  },

  getStorageUsageRate: async (params = {}) => {
    return apiClient.get('/api/reports/ministry/storage/usage-rate', buildParams(params));
  },

  getTotalStorageCapacity: async (params = {}) => {
    return apiClient.get('/api/reports/ministry/storage/total-capacity', buildParams(params));
  },

  getStorageTypesDistribution: async (params = {}) => {
    return apiClient.get('/api/reports/ministry/storage/types-distribution', buildParams(params));
  },

  // ===== LEGACY STATISTICS REPORTS (for backward compatibility) =====

  getUserDistributionByAgeGroup: async (params = {}) => {
    return apiClient.get('/api/reports/statistics/users/by-age-group', buildParams(params));
  },

  getUserDistributionByType: async (params = {}) => {
    return apiClient.get('/api/reports/statistics/users/by-type', buildParams(params));
  },

  getUserDistributionByGovernorate: async (params = {}) => {
    return apiClient.get('/api/reports/statistics/users/by-governorate', buildParams(params));
  },

  getProductionQuantitiesByProduct: async (params = {}) => {
    return apiClient.get('/api/reports/statistics/production/by-product', buildParams(params));
  },

  getProductDistributionByCategory: async (params = {}) => {
    return apiClient.get('/api/reports/statistics/products/by-category', buildParams(params));
  },

  getSeasonalProduction: async (params = {}) => {
    return apiClient.get('/api/reports/statistics/production/seasonal', buildParams(params));
  },
};

export default reportsService;

