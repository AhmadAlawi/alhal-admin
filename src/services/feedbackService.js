import apiClient from './api';

/**
 * Feedback Service
 * Handles all Feedback API endpoints for ratings and feedback
 */

const feedbackService = {
  /**
   * Submit feedback
   * @param {Object} feedbackData - Feedback data
   * @returns {Promise}
   */
  submitFeedback: async (feedbackData) => {
    return apiClient.post('/api/feedback/feedbacks', feedbackData);
  },

  /**
   * Get a specific feedback by ID
   * @param {number} feedbackId - Feedback ID
   * @returns {Promise}
   */
  getFeedback: async (feedbackId) => {
    return apiClient.get(`/api/feedback/feedbacks/${feedbackId}`);
  },

  /**
   * Get feedbacks given by a user
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  getFeedbacksGiven: async (userId) => {
    return apiClient.get(`/api/feedback/users/${userId}/feedbacks/given`);
  },

  /**
   * Get feedbacks received by a user
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  getFeedbacksReceived: async (userId) => {
    return apiClient.get(`/api/feedback/users/${userId}/feedbacks/received`);
  },

  /**
   * Get feedbacks for a conversation
   * @param {number} conversationId - Conversation ID
   * @returns {Promise}
   */
  getConversationFeedbacks: async (conversationId) => {
    return apiClient.get(`/api/feedback/conversations/${conversationId}/feedbacks`);
  },

  /**
   * Get user rating summary
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  getUserRatingSummary: async (userId) => {
    return apiClient.get(`/api/feedback/users/${userId}/rating-summary`);
  },
};

export default feedbackService;
