import apiClient from './api';

/**
 * Ticketing Service
 * Handles all Ticketing API endpoints for support tickets
 */

const ticketingService = {
  /**
   * Create a new ticket
   * @param {Object} ticketData - Ticket data
   * @returns {Promise}
   */
  createTicket: async (ticketData) => {
    return apiClient.post('/api/ticketing/tickets', ticketData);
  },

  /**
   * Get a specific ticket by ID
   * @param {number} ticketId - Ticket ID
   * @returns {Promise}
   */
  getTicket: async (ticketId) => {
    return apiClient.get(`/api/ticketing/tickets/${ticketId}`);
  },

  /**
   * Get all tickets (Admin/Staff)
   * @param {Object} params - Query parameters (status, priority, assignedToUserId, page, pageSize, etc.)
   * @returns {Promise}
   */
  getAllTickets: async (params = {}) => {
    const filteredParams = {};
    if (params.status) filteredParams.status = params.status;
    if (params.priority) filteredParams.priority = params.priority;
    if (params.category) filteredParams.category = params.category;
    if (params.assignedToUserId) filteredParams.assignedToUserId = params.assignedToUserId;
    if (params.page) filteredParams.page = params.page;
    if (params.pageSize) filteredParams.pageSize = params.pageSize;

    return apiClient.get('/api/ticketing/tickets', filteredParams);
  },

  /**
   * Get tickets by user ID
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  getUserTickets: async (userId) => {
    return apiClient.get(`/api/ticketing/users/${userId}/tickets`);
  },

  /**
   * Update a ticket
   * @param {number} ticketId - Ticket ID
   * @param {Object} updateData - Update data (status, priority, assignedToUserId, resolutionNotes, etc.)
   * @returns {Promise}
   */
  updateTicket: async (ticketId, updateData) => {
    return apiClient.put(`/api/ticketing/tickets/${ticketId}`, {
      ticketId,
      ...updateData,
    });
  },

  /**
   * Add a message to a ticket
   * @param {number} ticketId - Ticket ID
   * @param {Object} messageData - Message data (senderUserId, body, isInternal, attachmentUrls)
   * @returns {Promise}
   */
  addTicketMessage: async (ticketId, messageData) => {
    return apiClient.post(`/api/ticketing/tickets/${ticketId}/messages`, {
      ticketId,
      ...messageData,
    });
  },

  /**
   * Get messages for a ticket
   * @param {number} ticketId - Ticket ID
   * @returns {Promise}
   */
  getTicketMessages: async (ticketId) => {
    return apiClient.get(`/api/ticketing/tickets/${ticketId}/messages`);
  },

  /**
   * Mark ticket messages as read
   * @param {number} ticketId - Ticket ID
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  markMessagesAsRead: async (ticketId, userId) => {
    const endpoint = `/api/ticketing/tickets/${ticketId}/messages/read?userId=${userId}`;
    return apiClient.post(endpoint, {});
  },
};

export default ticketingService;
