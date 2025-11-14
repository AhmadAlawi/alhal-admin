import apiClient from './api';

/**
 * Admin Service
 * Handles admin-specific operations
 */

export const adminService = {
  // Health Check
  healthCheck: async () => {
    return apiClient.get('/api/admin/health');
  },

  // Users Management
  getUsers: async (params = {}) => {
    const filteredParams = {};
    if (params.page) filteredParams.page = params.page;
    if (params.pageSize) filteredParams.pageSize = params.pageSize;
    return apiClient.get('/api/admin/users', filteredParams);
  },

  getUser: async (userId) => {
    return apiClient.get(`/api/users/${userId}`);
  },

  assignRole: async (data) => {
    // data: { userId, roleName }
    return apiClient.post('/api/admin/users/assign-role', data);
  },

  removeRole: async (data) => {
    // data: { userId, roleName }
    return apiClient.post('/api/admin/users/remove-role', data);
  },

  toggleUserActive: async (data) => {
    // data: { userId, isActive }
    return apiClient.post('/api/admin/users/toggle-active', data);
  },

  // User Dashboard & Activity
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

  // Auctions Management
  forceCloseAuction: async (id) => {
    return apiClient.post(`/api/admin/auctions/${id}/force-close`);
  },

  // Products Management
  getProducts: async () => {
    return apiClient.get('/api/admin/products');
  },

  getProduct: async (id) => {
    return apiClient.get(`/api/admin/products/${id}`);
  },

  getProductWithPrices: async (id) => {
    return apiClient.get(`/api/admin/products/${id}/with-prices`);
  },

  addProduct: async (data) => {
    return apiClient.post('/api/admin/products', data);
  },

  updateProduct: async (id, data) => {
    return apiClient.put(`/api/admin/products/${id}`, data);
  },

  deleteProduct: async (id) => {
    return apiClient.delete(`/api/admin/products/${id}`);
  },

  // Government Prices
  getPrices: async () => {
    return apiClient.get('/api/admin/prices');
  },

  getProductPrice: async (productId) => {
    return apiClient.get(`/api/admin/prices/${productId}`);
  },

  getPriceHistory: async (productId, params = {}) => {
    const { from, to } = params;
    return apiClient.get(`/api/admin/prices/${productId}/history`, { from, to });
  },

  addPrice: async (data) => {
    return apiClient.post('/api/admin/prices', data);
  },

  // ===== CATEGORIES MANAGEMENT =====

  // Categories
  getCategories: async (params = {}) => {
    const filteredParams = {};
    if (params.isActive !== undefined) filteredParams.isActive = params.isActive;
    return apiClient.get('/api/admin/categories', filteredParams);
  },

  getCategory: async (id) => {
    return apiClient.get(`/api/admin/categories/${id}`);
  },

  createCategory: async (data) => {
    return apiClient.post('/api/admin/categories', data);
  },

  updateCategory: async (id, data) => {
    return apiClient.put(`/api/admin/categories/${id}`, data);
  },

  deleteCategory: async (id) => {
    return apiClient.delete(`/api/admin/categories/${id}`);
  },

  toggleCategoryActive: async (id) => {
    return apiClient.patch(`/api/admin/categories/${id}/toggle-active`);
  },

  // SubCategories
  getSubCategories: async (params = {}) => {
    const filteredParams = {};
    if (params.categoryId) filteredParams.categoryId = params.categoryId;
    if (params.isActive !== undefined) filteredParams.isActive = params.isActive;
    if (params.search) filteredParams.search = params.search;
    return apiClient.get('/api/admin/subcategories', filteredParams);
  },

  getSubCategoriesByCategory: async () => {
    return apiClient.get('/api/admin/subcategories/by-category');
  },

  getSubCategory: async (id) => {
    return apiClient.get(`/api/admin/subcategories/${id}`);
  },

  createSubCategory: async (data) => {
    return apiClient.post('/api/admin/subcategories', data);
  },

  updateSubCategory: async (id, data) => {
    return apiClient.put(`/api/admin/subcategories/${id}`, data);
  },

  deleteSubCategory: async (id) => {
    return apiClient.delete(`/api/admin/subcategories/${id}`);
  },

  toggleSubCategoryActive: async (id) => {
    return apiClient.patch(`/api/admin/subcategories/${id}/toggle-active`);
  },
};

export default adminService;

