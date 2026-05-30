import apiClient from './api';

export const dashboardService = {
  getKPIs: async (date) => {
    const params = {};
    if (date) params.date = date;
    return apiClient.get('/api/gov/dashboard/kpis', params);
  },

  getMapData: async (date) => {
    const params = {};
    if (date) params.date = date;
    return apiClient.get('/api/gov/dashboard/map', params);
  },

  getAutoFillData: async (params = {}) => {
    const filteredParams = {};
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.governorateId != null) filteredParams.governorateId = params.governorateId;
    if (params.days) filteredParams.days = params.days;
    return apiClient.get('/api/gov/dashboard/auto-fill', filteredParams);
  },

  getOverview: async (params = {}) => {
    const filteredParams = {};
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.governorateId != null) filteredParams.governorateId = params.governorateId;
    return apiClient.get('/api/gov/dashboard/overview', filteredParams);
  },

  getRealTimeData: async () => {
    return apiClient.get('/api/gov/dashboard/real-time');
  },

  getAnalyticsBreakdown: async (params = {}) => {
    const filteredParams = {};
    if (params.groupBy) filteredParams.groupBy = params.groupBy;
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.governorateId != null) filteredParams.governorateId = params.governorateId;
    if (params.days) filteredParams.days = params.days;
    if (params.topN) filteredParams.topN = params.topN;
    return apiClient.get('/api/gov/dashboard/analytics/breakdown', filteredParams);
  },

  getProductionByCategory: async (params = {}) => {
    const filteredParams = {};
    if (params.year != null) filteredParams.year = params.year;
    return apiClient.get('/api/gov/dashboard/charts/production-by-category', filteredParams);
  },

  getTopProductsByProduction: async (params = {}) => {
    const filteredParams = {};
    if (params.year != null) filteredParams.year = params.year;
    if (params.topN != null) filteredParams.topN = params.topN;
    return apiClient.get('/api/gov/dashboard/charts/top-products-by-production', filteredParams);
  },

  getUserSummary: async (params = {}) => {
    const filteredParams = {};
    if (params.userId) filteredParams.userId = params.userId;
    if (params.from) filteredParams.from = params.from;
    if (params.to) filteredParams.to = params.to;
    return apiClient.get('/api/gov/dashboard/user/summary', filteredParams);
  },

  getUserAuctions: async (params = {}) => {
    const filteredParams = {};
    if (params.userId) filteredParams.userId = params.userId;
    if (params.from) filteredParams.from = params.from;
    if (params.to) filteredParams.to = params.to;
    return apiClient.get('/api/gov/dashboard/user/auctions', filteredParams);
  },

  getUserTenders: async (params = {}) => {
    const filteredParams = {};
    if (params.userId) filteredParams.userId = params.userId;
    if (params.from) filteredParams.from = params.from;
    if (params.to) filteredParams.to = params.to;
    return apiClient.get('/api/gov/dashboard/user/tenders', filteredParams);
  },

  getUserDirectSales: async (params = {}) => {
    const filteredParams = {};
    if (params.userId) filteredParams.userId = params.userId;
    if (params.from) filteredParams.from = params.from;
    if (params.to) filteredParams.to = params.to;
    return apiClient.get('/api/gov/dashboard/user/direct', filteredParams);
  },
};

export default dashboardService;
