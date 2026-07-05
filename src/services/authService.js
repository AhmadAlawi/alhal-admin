import apiClient from './api';
import rbacService from './rbacService';
import {
  extractAccessFromToken,
  normalizeAuthMeResponse,
  persistAccessToStorage,
} from '../utils/jwtUtils';
import { resolveUserAccess } from '../utils/resolveUserAccess';

const pickField = (obj, ...keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return undefined;
};

/** Unwrap nested { data: { data: { AccessToken, ... } } } login payloads. */
const unwrapAuthPayload = (response) => {
  let current = response?.data ?? response;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== 'object') break;

    const hasToken = pickField(current, 'accessToken', 'AccessToken', 'token', 'Token');
    if (hasToken) return current;

    const inner = current.data ?? current.Data;
    if (!inner || typeof inner !== 'object') break;
    current = inner;
  }

  return current && typeof current === 'object' ? current : {};
};

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
      const authToken = token || localStorage.getItem('authToken');

      if (!authToken) {
        console.error('No authentication token available in localStorage');
        throw new Error('No authentication token available. Please login again.');
      }

      const params = { token: authToken };
      const response = await apiClient.get('/api/auth/me', params);
      const user = normalizeAuthMeResponse(response, authToken);
      const access = await resolveUserAccess({
        token: authToken,
        userId: user.userId,
        fetchRbac: () => rbacService.getMyAccess(),
      });

      if (access.userId) {
        localStorage.setItem('userId', String(access.userId));
      }

      if (access.roles.length || access.permissions.length) {
        persistAccessToStorage({
          roles: access.roles,
          permissions: access.permissions,
          userId: access.userId,
        });
      }

      const existingUser = authService.getUser?.() || {};
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...existingUser,
          userId: access.userId ?? existingUser.userId,
          fullName: user.fullName ?? existingUser.fullName,
          email: user.email ?? existingUser.email,
          phone: user.phone ?? existingUser.phone,
          roles: access.roles.length ? access.roles : existingUser.roles || [],
          permissions: access.permissions.length
            ? access.permissions
            : existingUser.permissions || [],
        })
      );

      return { success: true, ...user, ...access };
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

      const responseData = unwrapAuthPayload(response);

      const token = pickField(responseData, 'accessToken', 'AccessToken', 'token', 'Token');
      if (token) {
        localStorage.setItem('authToken', token);
        console.log('Auth token stored');
      }

      const refreshToken = pickField(responseData, 'refreshToken', 'RefreshToken');
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('Refresh token stored');
      }

      const expiresAt = pickField(responseData, 'expiresAt', 'ExpiresAt');
      if (expiresAt) {
        localStorage.setItem('tokenExpiresAt', expiresAt);
        console.log('Token expiration stored:', expiresAt);
      }

      const userId = pickField(responseData, 'userId', 'UserId', 'id', 'Id');
      if (userId) {
        localStorage.setItem('userId', userId.toString());
        console.log('User ID stored:', userId);
      }

      const jwtAccess = token ? extractAccessFromToken(token) : { roles: [], permissions: [] };
      const rolesFromResponse = responseData.roles || responseData.Roles || [];
      let roles =
        jwtAccess.roles.length > 0 ? jwtAccess.roles : rolesFromResponse;
      let permissions = jwtAccess.permissions || [];

      const access = await resolveUserAccess({
        token,
        userId,
        fetchRbac: () => rbacService.getMyAccess({ suppressAuthRedirect: true }),
      });
      if (access.roles.length) roles = access.roles;
      if (access.permissions.length) permissions = access.permissions;
      if (access.userId != null) {
        localStorage.setItem('userId', String(access.userId));
      }

      const user = {
        userId: access.userId ?? userId,
        fullName: pickField(responseData, 'fullName', 'FullName', 'name', 'Name'),
        email: pickField(responseData, 'email', 'Email'),
        phone: pickField(responseData, 'phone', 'Phone'),
        roles,
        permissions,
      };

      if (user.userId) {
        localStorage.setItem('user', JSON.stringify(user));
        persistAccessToStorage({ roles, permissions, userId });
        console.log('User data stored:', user);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-login'));
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
    localStorage.removeItem('userAccess');
    localStorage.removeItem('fcmToken');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-logout'));
    }
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

