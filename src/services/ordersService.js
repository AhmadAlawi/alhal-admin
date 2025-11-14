import apiClient from './api';

/**
 * Orders Service (Direct Sales)
 * Handles order-related operations
 */

export const ordersService = {
  // Get all listings
  getListings: async () => {
    return apiClient.get('/api/direct/listings');
  },

  // Get listing by ID
  getListing: async (id) => {
    return apiClient.get(`/api/direct/listings/${id}`);
  },

  // Create listing
  createListing: async (data) => {
    return apiClient.post('/api/direct/listings', data);
  },

  // Update listing
  updateListing: async (id, data) => {
    return apiClient.put(`/api/direct/listings/${id}`, data);
  },

  // Set listing status
  setListingStatus: async (id, data) => {
    return apiClient.post(`/api/direct/listings/${id}/status`, data);
  },

  // Cancel listing
  cancelListing: async (id, data) => {
    return apiClient.post(`/api/direct/listings/${id}/cancel`, data);
  },

  // Get order by ID
  getOrder: async (id) => {
    return apiClient.get(`/api/direct/orders/${id}`);
  },

  // Get orders by buyer
  getOrdersByBuyer: async (buyerUserId) => {
    return apiClient.get(`/api/direct/buyers/${buyerUserId}/orders`);
  },

  // Get orders by seller
  getOrdersBySeller: async (sellerUserId) => {
    return apiClient.get(`/api/direct/sellers/${sellerUserId}/orders`);
  },

  // Create order
  createOrder: async (data) => {
    return apiClient.post('/api/direct/orders', data);
  },

  // Update order status
  updateOrderStatus: async (id, data) => {
    return apiClient.post(`/api/direct/orders/${id}/status`, data);
  },

  // Update order address
  updateOrderAddress: async (id, data) => {
    return apiClient.post(`/api/direct/orders/${id}/address`, data);
  },

  // Update order quantity
  updateOrderQty: async (id, data) => {
    return apiClient.post(`/api/direct/orders/${id}/qty`, data);
  },

  // Cancel order
  cancelOrder: async (id, data) => {
    return apiClient.post(`/api/direct/orders/${id}/cancel`, data);
  },

  // Pay for order
  payOrder: async (id) => {
    return apiClient.post(`/api/direct/orders/${id}/pay`);
  },
};

export default ordersService;

