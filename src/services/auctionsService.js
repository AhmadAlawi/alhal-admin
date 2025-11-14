import apiClient from './api';

/**
 * Auctions Service
 * Handles auction-related operations
 */

export const auctionsService = {
  // Get all open auctions
  getOpenAuctions: async () => {
    return apiClient.get('/api/auctions/open');
  },

  // Get auction by ID
  getAuction: async (id) => {
    return apiClient.get(`/api/auctions/${id}`);
  },

  // Get auctions by user
  getAuctionsByUser: async (userId) => {
    return apiClient.get(`/api/auctions/by-user/${userId}`);
  },

  // Get auctions joined by user
  getAuctionsJoinedByUser: async (userId) => {
    return apiClient.get(`/api/auctions/joined/by-user/${userId}`);
  },

  // Get bids for auction
  getBids: async (auctionId) => {
    return apiClient.get(`/api/auctions/bids/${auctionId}`);
  },

  // Create auction
  createAuction: async (data, createdByUserId) => {
    return apiClient.post(`/api/auctions?createdByUserId=${createdByUserId}`, data);
  },

  // Update auction
  updateAuction: async (id, data) => {
    return apiClient.put(`/api/auctions/${id}`, data);
  },

  // Place bid
  placeBid: async (id, data) => {
    return apiClient.post(`/api/auctions/${id}/bids`, data);
  },

  // Join auction
  joinAuction: async (id, userId) => {
    return apiClient.get(`/api/auctions/${id}/join`, { userId });
  },

  // Cancel auction
  cancelAuction: async (id, data) => {
    return apiClient.post(`/api/auctions/${id}/cancel`, data);
  },
};

export default auctionsService;

