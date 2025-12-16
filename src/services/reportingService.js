import apiClient from './api';

/**
 * Reporting Service
 * Handles all Reporting API endpoints for chat reports
 */

const reportingService = {
  /**
   * Create a new report
   * @param {Object} reportData - Report data
   * @returns {Promise}
   */
  createReport: async (reportData) => {
    return apiClient.post('/api/reporting/reports', reportData);
  },

  /**
   * Get a specific report by ID
   * @param {number} reportId - Report ID
   * @returns {Promise}
   */
  getReport: async (reportId) => {
    return apiClient.get(`/api/reporting/reports/${reportId}`);
  },

  /**
   * Get all reports (Admin)
   * @param {Object} params - Query parameters (status, page, pageSize, etc.)
   * @returns {Promise}
   */
  getAllReports: async (params = {}) => {
    const filteredParams = {};
    if (params.status) filteredParams.status = params.status;
    if (params.page) filteredParams.page = params.page;
    if (params.pageSize) filteredParams.pageSize = params.pageSize;
    if (params.reportType) filteredParams.reportType = params.reportType;
    if (params.assignedToUserId) filteredParams.assignedToUserId = params.assignedToUserId;

    return apiClient.get('/api/reporting/reports', filteredParams);
  },

  /**
   * Get reports by user ID
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  getUserReports: async (userId) => {
    return apiClient.get(`/api/reporting/users/${userId}/reports`);
  },

  /**
   * Get reports for a conversation
   * @param {number} conversationId - Conversation ID
   * @returns {Promise}
   */
  getConversationReports: async (conversationId) => {
    return apiClient.get(`/api/reporting/conversations/${conversationId}/reports`);
  },

  /**
   * Update report status (Admin)
   * @param {number} reportId - Report ID
   * @param {Object} updateData - Update data (status, adminNotes, assignedToUserId)
   * @returns {Promise}
   */
  updateReportStatus: async (reportId, updateData) => {
    return apiClient.put(`/api/reporting/reports/${reportId}/status`, {
      reportId,
      ...updateData,
    });
  },
};

export default reportingService;
