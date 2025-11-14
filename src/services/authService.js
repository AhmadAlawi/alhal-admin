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
      // Get token from parameter or localStorage
      const authToken = token || localStorage.getItem('authToken');
      
      // API requires token as query parameter - always send it
      if (!authToken) {
        console.error('No authentication token available in localStorage');
        throw new Error('No authentication token available. Please login again.');
      }
      
      // Always send token as query parameter (API requirement)
      const params = {
        token: authToken
      };
      
      console.log('Getting current user with token (length):', authToken.length);
      
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
      
      // Handle nested response structure: response.data.data.accessToken
      // Response structure: { success: true, data: { data: { accessToken, userId, ... } } }
      const responseData = response.data?.data || response.data || response;
      
      // Store access token
      const token = responseData.accessToken || responseData.token || response.accessToken || response.token;
      if (token) {
        localStorage.setItem('authToken', token);
        console.log('Auth token stored');
      }
      
      // Store refresh token if provided
      const refreshToken = responseData.refreshToken;
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('Refresh token stored');
      }
      
      // Store token expiration if provided
      const expiresAt = responseData.expiresAt;
      if (expiresAt) {
        localStorage.setItem('tokenExpiresAt', expiresAt);
        console.log('Token expiration stored:', expiresAt);
      }
      
      // Store user ID
      const userId = responseData.userId || responseData.id;
      if (userId) {
        localStorage.setItem('userId', userId.toString());
        console.log('User ID stored:', userId);
      }
      
      // Store user info
      const user = {
        userId: userId,
        fullName: responseData.fullName || responseData.name,
        email: responseData.email,
        phone: responseData.phone,
        roles: responseData.roles || []
      };
      
      // Only store user if we have at least userId
      if (user.userId) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('User data stored:', user);
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
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    localStorage.removeItem('fcmToken');
    console.log('User logged out - all auth data cleared');
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

    return null;
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

