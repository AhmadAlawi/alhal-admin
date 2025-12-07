import apiClient from './api';

/**
 * Reports Service
 * Handles all Reports API endpoints for Ministry and Statistics reports
 */

const reportsService = {
  // ===== MINISTRY REPORTS =====

  /**
   * Monthly Market Flow
   * Comparison between incoming and outgoing products monthly (in tons)
   */
  getMonthlyMarketFlow: async (params = {}) => {
    const filteredParams = {};
    if (params.startDate) filteredParams.startDate = params.startDate;
    if (params.endDate) filteredParams.endDate = params.endDate;
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.governorateId) filteredParams.governorateId = params.governorateId;
    if (params.productId) filteredParams.productId = params.productId;
    if (params.timeGroup) filteredParams.timeGroup = params.timeGroup;

    return apiClient.get('/api/reports/ministry/market-flow/monthly', filteredParams);
  },

  /**
   * Storage Capacity by Governorate
   * Distribution of storage capacity and actual usage by governorate (in tons)
   */
  getStorageCapacityByGovernorate: async (params = {}) => {
    const filteredParams = {};
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.startDate) filteredParams.startDate = params.startDate;
    if (params.endDate) filteredParams.endDate = params.endDate;
    if (params.timeGroup) filteredParams.timeGroup = params.timeGroup;

    return apiClient.get('/api/reports/ministry/storage-capacity/by-governorate', filteredParams);
  },

  /**
   * Current Month Market Flow
   * Monthly market flow with percentage change from previous period
   */
  getCurrentMonthMarketFlow: async (params = {}) => {
    const filteredParams = {};
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.governorateId) filteredParams.governorateId = params.governorateId;
    if (params.productId) filteredParams.productId = params.productId;
    if (params.timeGroup) filteredParams.timeGroup = params.timeGroup;

    return apiClient.get('/api/reports/ministry/market-flow/current-month', filteredParams);
  },

  /**
   * Storage Usage Rate
   * Usage rate - actual usage vs total capacity
   */
  getStorageUsageRate: async (params = {}) => {
    const filteredParams = {};
    if (params.governorate) filteredParams.governorate = params.governorate;

    return apiClient.get('/api/reports/ministry/storage/usage-rate', filteredParams);
  },

  /**
   * Total Storage Capacity
   * Total storage capacity
   */
  getTotalStorageCapacity: async (params = {}) => {
    const filteredParams = {};
    if (params.governorate) filteredParams.governorate = params.governorate;

    return apiClient.get('/api/reports/ministry/storage/total-capacity', filteredParams);
  },

  /**
   * Storage Types Distribution
   * Distribution of storage types - percentages of different storage facilities
   */
  getStorageTypesDistribution: async (params = {}) => {
    const filteredParams = {};
    if (params.governorate) filteredParams.governorate = params.governorate;

    return apiClient.get('/api/reports/ministry/storage/types-distribution', filteredParams);
  },

  // ===== STATISTICS REPORTS =====

  /**
   * User Distribution by Age Group
   * User distribution by age group - percentage for each age group
   */
  getUserDistributionByAgeGroup: async (params = {}) => {
    const filteredParams = {};
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.startDate) filteredParams.startDate = params.startDate;
    if (params.endDate) filteredParams.endDate = params.endDate;
    if (params.timeGroup) filteredParams.timeGroup = params.timeGroup;

    return apiClient.get('/api/reports/statistics/users/by-age-group', filteredParams);
  },

  /**
   * User Distribution by Type
   * User distribution by type - percentage for each user type
   */
  getUserDistributionByType: async (params = {}) => {
    const filteredParams = {};
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.startDate) filteredParams.startDate = params.startDate;
    if (params.endDate) filteredParams.endDate = params.endDate;
    if (params.timeGroup) filteredParams.timeGroup = params.timeGroup;

    return apiClient.get('/api/reports/statistics/users/by-type', filteredParams);
  },

  /**
   * User Activity
   * User activity - active and new users throughout the year
   */
  getUserActivity: async (params = {}) => {
    const filteredParams = {};
    if (params.startDate) filteredParams.startDate = params.startDate;
    if (params.endDate) filteredParams.endDate = params.endDate;
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.governorateId) filteredParams.governorateId = params.governorateId;
    if (params.timeGroup) filteredParams.timeGroup = params.timeGroup;

    return apiClient.get('/api/reports/statistics/users/activity', filteredParams);
  },

  /**
   * User Distribution by Governorate
   * User distribution by governorate - percentage of users in each governorate
   */
  getUserDistributionByGovernorate: async (params = {}) => {
    const filteredParams = {};
    if (params.startDate) filteredParams.startDate = params.startDate;
    if (params.endDate) filteredParams.endDate = params.endDate;
    if (params.timeGroup) filteredParams.timeGroup = params.timeGroup;

    return apiClient.get('/api/reports/statistics/users/by-governorate', filteredParams);
  },

  /**
   * Production Quantities by Product
   * Production quantities by product - production quantity in tons per product
   */
  getProductionQuantitiesByProduct: async (params = {}) => {
    const filteredParams = {};
    if (params.startDate) filteredParams.startDate = params.startDate;
    if (params.endDate) filteredParams.endDate = params.endDate;
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.categoryId) filteredParams.categoryId = params.categoryId;
    if (params.timeGroup) filteredParams.timeGroup = params.timeGroup;

    return apiClient.get('/api/reports/statistics/production/by-product', filteredParams);
  },

  /**
   * Product Distribution by Category
   * Product distribution by category - percentage for each product category
   */
  getProductDistributionByCategory: async (params = {}) => {
    const filteredParams = {};
    if (params.startDate) filteredParams.startDate = params.startDate;
    if (params.endDate) filteredParams.endDate = params.endDate;
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.timeGroup) filteredParams.timeGroup = params.timeGroup;

    return apiClient.get('/api/reports/statistics/products/by-category', filteredParams);
  },

  /**
   * Seasonal Production
   * Seasonal production - monthly production quantities by product category (in tons)
   */
  getSeasonalProduction: async (params = {}) => {
    const filteredParams = {};
    if (params.year) filteredParams.year = params.year;
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.categoryId) filteredParams.categoryId = params.categoryId;
    if (params.timeGroup) filteredParams.timeGroup = params.timeGroup;

    return apiClient.get('/api/reports/statistics/production/seasonal', filteredParams);
  },
};

export default reportsService;

