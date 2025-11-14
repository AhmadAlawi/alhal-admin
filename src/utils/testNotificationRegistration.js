/**
 * Test utility for device registration
 * This file can be used to test device registration manually
 */

import notificationService from '../services/notificationService';
import { getFCMToken } from '../config/firebase';

/**
 * Test device registration
 * @param {number} userId - User ID to register device for
 * @returns {Promise} Registration result
 */
export const testDeviceRegistration = async (userId = 1) => {
  try {
    console.log('Testing device registration...');
    console.log('User ID:', userId);
    
    // Get FCM token
    const token = await getFCMToken();
    if (!token) {
      console.error('FCM token not available. Please enable notifications first.');
      return null;
    }
    
    console.log('FCM Token:', token);
    
    // Register device
    const result = await notificationService.registerDevice(userId, {
      token: token,
      // All other fields will be auto-detected
    });
    
    console.log('Device registration successful:', result);
    return result;
  } catch (error) {
    console.error('Device registration failed:', error);
    throw error;
  }
};

/**
 * Test device registration with custom device info
 * @param {number} userId - User ID to register device for
 * @param {object} customDeviceInfo - Custom device information
 * @returns {Promise} Registration result
 */
export const testDeviceRegistrationWithCustomInfo = async (userId = 1, customDeviceInfo = {}) => {
  try {
    console.log('Testing device registration with custom info...');
    console.log('User ID:', userId);
    console.log('Custom Device Info:', customDeviceInfo);
    
    // Register device with custom info
    const result = await notificationService.registerDevice(userId, {
      token: customDeviceInfo.token || await getFCMToken(),
      deviceType: customDeviceInfo.deviceType || 'web',
      deviceId: customDeviceInfo.deviceId || `test-device-${Date.now()}`,
      deviceName: customDeviceInfo.deviceName || 'Test Device',
      appVersion: customDeviceInfo.appVersion || '1.0.0',
      platform: customDeviceInfo.platform || 'web'
    });
    
    console.log('Device registration successful:', result);
    return result;
  } catch (error) {
    console.error('Device registration failed:', error);
    throw error;
  }
};

/**
 * Example usage in browser console:
 * 
 * import { testDeviceRegistration } from './utils/testNotificationRegistration';
 * testDeviceRegistration(1);
 * 
 * Or with custom device info:
 * import { testDeviceRegistrationWithCustomInfo } from './utils/testNotificationRegistration';
 * testDeviceRegistrationWithCustomInfo(1, {
 *   deviceName: 'Chrome Browser',
 *   appVersion: '2.0.0'
 * });
 */

export default {
  testDeviceRegistration,
  testDeviceRegistrationWithCustomInfo
};

