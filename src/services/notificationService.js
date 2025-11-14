import apiClient from './api';
import { getFCMToken } from '../config/firebase';

/**
 * Get device type (web, android, ios)
 * @returns {string} Device type
 */
const getDeviceType = () => {
  if (typeof window === 'undefined') return 'web';
  
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  
  return 'web';
};

/**
 * Get unique device ID (stored in localStorage or generated)
 * @returns {string} Device ID
 */
const getDeviceId = () => {
  if (typeof window === 'undefined') return 'unknown';
  
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    // Generate a unique device ID
    deviceId = 'web-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

/**
 * Get device name/model
 * @returns {string} Device name
 */
const getDeviceName = () => {
  if (typeof window === 'undefined') return 'Unknown Device';
  
  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  
  // Try to extract device name from user agent
  if (/android/i.test(userAgent)) {
    // Extract Android device model
    const match = userAgent.match(/Android.*?; ([\w\s]+)\//);
    if (match && match[1]) {
      return match[1].trim();
    }
    return 'Android Device';
  }
  
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    // Extract iOS device model
    const match = userAgent.match(/(iPhone|iPad|iPod)[\w\s]*/);
    if (match && match[0]) {
      return match[0];
    }
    return 'iOS Device';
  }
  
  // For web, use browser and OS info
  const browser = getBrowserName();
  const os = getOSName();
  return `${browser} on ${os}`;
};

/**
 * Get browser name
 * @returns {string} Browser name
 */
const getBrowserName = () => {
  if (typeof window === 'undefined') return 'Unknown';
  
  const userAgent = navigator.userAgent || '';
  
  if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
  if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
  if (userAgent.indexOf('Safari') > -1) return 'Safari';
  if (userAgent.indexOf('Edge') > -1) return 'Edge';
  if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) return 'Opera';
  
  return 'Unknown Browser';
};

/**
 * Get OS name
 * @returns {string} OS name
 */
const getOSName = () => {
  if (typeof window === 'undefined') return 'Unknown';
  
  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  
  if (/win/i.test(platform)) return 'Windows';
  if (/mac/i.test(platform)) return 'macOS';
  if (/linux/i.test(platform)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
  
  return 'Unknown OS';
};

/**
 * Get app version (from package.json or environment variable)
 * @returns {string} App version
 */
const getAppVersion = () => {
  // Try to get version from environment variable
  if (import.meta.env.VITE_APP_VERSION) {
    return import.meta.env.VITE_APP_VERSION;
  }
  
  // Default version
  return '1.0.0';
};

/**
 * Notification Service
 * Handles notification-related API calls
 */
export const notificationService = {
  /**
   * Register device with FCM token
   * @param {string|number} userId - User ID
   * @param {object} deviceInfo - Device information
   * @param {string} deviceInfo.token - FCM token (optional, will fetch if not provided)
   * @param {string} deviceInfo.deviceType - Device type (e.g., 'android', 'ios', 'web')
   * @param {string} deviceInfo.deviceId - Unique device identifier
   * @param {string} deviceInfo.deviceName - Device name/model
   * @param {string} deviceInfo.appVersion - App version
   * @param {string} deviceInfo.platform - Platform (e.g., 'mobile', 'web')
   * @returns {Promise} Response
   */
  registerDevice: async (userId, deviceInfo = {}) => {
    try {
      const fcmToken = deviceInfo.token || await getFCMToken();
      if (!fcmToken) {
        throw new Error('FCM token not available');
      }

      // Get device information - ensure all values are strings
      const deviceType = String(deviceInfo.deviceType || getDeviceType());
      const deviceId = String(deviceInfo.deviceId || getDeviceId());
      const deviceName = String(deviceInfo.deviceName || getDeviceName());
      const appVersion = String(deviceInfo.appVersion || getAppVersion());
      const platform = String(deviceInfo.platform || 'web');

      // Build request payload
      const payload = {
        token: String(fcmToken),
        deviceType: deviceType,
        deviceId: deviceId,
        deviceName: deviceName,
        appVersion: appVersion,
        platform: platform
      };

      console.log('Registering device:', {
        userId,
        deviceType,
        deviceId,
        deviceName,
        appVersion,
        platform,
        tokenLength: fcmToken.length
      });

      const response = await apiClient.post(`/api/notifications/devices/register?userId=${userId}`, payload);
      
      console.log('Device registered successfully:', response);
      return response;
    } catch (error) {
      console.error('Error registering device:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        userId,
        deviceInfo
      });
      throw error;
    }
  },

  /**
   * Register FCM token with the backend (legacy method, use registerDevice instead)
   * @param {string|number} userId - User ID
   * @param {string} token - FCM token (optional, will fetch if not provided)
   * @returns {Promise} Response
   */
  registerToken: async (userId, token = null) => {
    // Use the new registerDevice method
    return notificationService.registerDevice(userId, {
      token: token,
      deviceType: getDeviceType(),
      deviceId: getDeviceId(),
      deviceName: getDeviceName(),
      appVersion: getAppVersion(),
      platform: 'web'
    });
  },

  /**
   * Unregister device
   * @param {string|number} userId - User ID
   * @param {object} deviceInfo - Device information (optional)
   * @param {string} deviceInfo.token - FCM token (optional, will fetch if not provided)
   * @param {string} deviceInfo.deviceId - Device ID (optional, will fetch if not provided)
   * @returns {Promise} Response
   */
  unregisterDevice: async (userId, deviceInfo = {}) => {
    try {
      const fcmToken = deviceInfo.token || await getFCMToken();
      const deviceId = deviceInfo.deviceId || getDeviceId();
      
      if (!fcmToken && !deviceId) {
        return { success: true, message: 'No token or device ID to unregister' };
      }

      return apiClient.post(`/api/notifications/devices/unregister?userId=${userId}`, {
        token: fcmToken,
        deviceId: deviceId
      });
    } catch (error) {
      console.error('Error unregistering device:', error);
      throw error;
    }
  },

  /**
   * Unregister FCM token (legacy method, use unregisterDevice instead)
   * @param {string|number} userId - User ID
   * @param {string} token - FCM token (optional)
   * @returns {Promise} Response
   */
  unregisterToken: async (userId, token = null) => {
    // Use the new unregisterDevice method
    return notificationService.unregisterDevice(userId, {
      token: token,
      deviceId: getDeviceId()
    });
  },

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @param {object} params - Query parameters (page, pageSize, etc.)
   * @returns {Promise} Response
   */
  getNotifications: async (userId, params = {}) => {
    const filteredParams = {};
    if (params.page) filteredParams.page = params.page;
    if (params.pageSize) filteredParams.pageSize = params.pageSize;
    if (params.read) filteredParams.read = params.read;

    return apiClient.get(`/api/notifications/user/${userId}`, filteredParams);
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Response
   */
  markAsRead: async (notificationId) => {
    return apiClient.patch(`/api/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   * @returns {Promise} Response
   */
  markAllAsRead: async (userId) => {
    return apiClient.patch(`/api/notifications/user/${userId}/read-all`);
  },

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Response
   */
  deleteNotification: async (notificationId) => {
    return apiClient.delete(`/api/notifications/${notificationId}`);
  },

  /**
   * Get notification settings
   * @param {string} userId - User ID
   * @returns {Promise} Response
   */
  getSettings: async (userId) => {
    return apiClient.get(`/api/notifications/user/${userId}/settings`);
  },

  /**
   * Update notification settings
   * @param {string} userId - User ID
   * @param {object} settings - Notification settings
   * @returns {Promise} Response
   */
  updateSettings: async (userId, settings) => {
    return apiClient.put(`/api/notifications/user/${userId}/settings`, settings);
  }
};

export default notificationService;

