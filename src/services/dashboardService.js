import apiClient from './api';

/**
 * Government Dashboard Service
 * Handles government dashboard KPIs and data
 */

export const dashboardService = {
  // Get Dashboard KPIs (Original endpoint - returns crop data)
  getKPIs: async (date) => {
    const params = {};
    if (date) params.date = date;
    return apiClient.get('/api/gov/dashboard/kpis', params);
  },

  // Get Map Data (Returns governorate data)
  getMapData: async (date) => {
    const params = {};
    if (date) params.date = date;
    return apiClient.get('/api/gov/dashboard/map', params);
  },

  // Get Auto-fill Dashboard Data (Comprehensive dashboard data)
  getAutoFillData: async (params = {}) => {
    const filteredParams = {};
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.days) filteredParams.days = params.days;
    return apiClient.get('/api/gov/dashboard/auto-fill', filteredParams);
  },

  // Get Dashboard Overview
  getOverview: async (governorate) => {
    const params = {};
    if (governorate) params.governorate = governorate;
    return apiClient.get('/api/gov/dashboard/overview', params);
  },

  // Get Real-time Dashboard Data
  getRealTimeData: async () => {
    return apiClient.get('/api/gov/dashboard/real-time');
  },

  // Get Analytics Breakdown
  getAnalyticsBreakdown: async (params = {}) => {
    const filteredParams = {};
    if (params.groupBy) filteredParams.groupBy = params.groupBy;
    if (params.governorate) filteredParams.governorate = params.governorate;
    if (params.days) filteredParams.days = params.days;
    if (params.topN) filteredParams.topN = params.topN;
    return apiClient.get('/api/gov/dashboard/analytics/breakdown', filteredParams);
  },

  // Export Map Data
  exportMapData: async (params = {}) => {
    const filteredParams = { format: params.format || 'csv' };
    if (params.date) filteredParams.date = params.date;
    return apiClient.get('/api/gov/dashboard/map/export', filteredParams);
  },

  // Get User Summary
  getUserSummary: async (params = {}) => {
    const filteredParams = {};
    if (params.userId) filteredParams.userId = params.userId;
    if (params.from) filteredParams.from = params.from;
    if (params.to) filteredParams.to = params.to;
    return apiClient.get('/api/gov/dashboard/user/summary', filteredParams);
  },

  // Get User Auctions
  getUserAuctions: async (params = {}) => {
    const filteredParams = {};
    if (params.userId) filteredParams.userId = params.userId;
    if (params.from) filteredParams.from = params.from;
    if (params.to) filteredParams.to = params.to;
    return apiClient.get('/api/gov/dashboard/user/auctions', filteredParams);
  },

  // Get User Tenders
  getUserTenders: async (params = {}) => {
    const filteredParams = {};
    if (params.userId) filteredParams.userId = params.userId;
    if (params.from) filteredParams.from = params.from;
    if (params.to) filteredParams.to = params.to;
    return apiClient.get('/api/gov/dashboard/user/tenders', filteredParams);
  },

  // Get User Direct Sales
  getUserDirectSales: async (params = {}) => {
    const filteredParams = {};
    if (params.userId) filteredParams.userId = params.userId;
    if (params.from) filteredParams.from = params.from;
    if (params.to) filteredParams.to = params.to;
    return apiClient.get('/api/gov/dashboard/user/direct', filteredParams);
  },
};

export default dashboardService;

