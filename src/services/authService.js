import apiClient from './api';

/**
 * Auth Service
 * Handles authentication-related API calls
 */
export const authService = {
  /**
   * Get current user information
   * @param {string} token - Auth token (optional, will use from localStorage if not provided)
   * @returns {Promise} Response with user information
   */
  getCurrentUser: async (token = null) => {
    try {
      const params = {};
      if (token) {
        params.token = token;
      }
      return apiClient.get('/api/auth/me', params);
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  /**
   * Login
   * @param {object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise} Response with token and user info
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      
      // Store token if provided
      if (response.token || response.data?.token) {
        localStorage.setItem('authToken', response.token || response.data.token);
      }
      
      // Store user info if provided
      if (response.user || response.data?.user) {
        const user = response.user || response.data.user;
        if (user.userId || user.id) {
          localStorage.setItem('userId', user.userId || user.id);
        }
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  /**
   * Register
   * @param {object} userData - User registration data
   * @returns {Promise} Response
   */
  register: async (userData) => {
    try {
      return apiClient.post('/api/auth/register', userData);
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  },

  /**
   * Logout
   */
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    localStorage.removeItem('fcmToken');
  },

  /**
   * Get stored user ID
   * @returns {string|number|null} User ID or null
   */
  getUserId: () => {
    // Try to get from localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      return userId;
    }

    // Try to get from user object
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.userId || user.id || null;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // For testing, return userId 5 if not found
    // TODO: Remove this in production and return null
    return 5;
  },

  /**
   * Get stored user information
   * @returns {object|null} User object or null
   */
  getUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  }
};

export default authService;

