import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  requestNotificationPermission,
  getFCMToken,
  onMessageListener,
  isNotificationSupported,
  getNotificationPermission
} from '../config/firebase';
import notificationService from '../services/notificationService';
import authService from '../services/authService';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState(getNotificationPermission());
  const [fcmToken, setFcmToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!isNotificationSupported()) {
        console.warn('Notifications are not supported in this browser');
        setIsInitialized(true);
        return;
      }

      try {
        // Check if permission was previously granted
        const currentPermission = getNotificationPermission();
        setPermission(currentPermission);

        if (currentPermission === 'granted') {
          // Get FCM token
          const token = await getFCMToken();
          if (token) {
            setFcmToken(token);
            console.log('FCM Token retrieved:', token);
            
            // Auto-register device with backend if userId is available
            // For testing, use userId 5
            let userId = authService.getUserId();
            
            // If userId not found, try to get from API
            if (!userId && authService.isAuthenticated()) {
              try {
                const currentUser = await authService.getCurrentUser();
                userId = currentUser?.userId || currentUser?.data?.userId || currentUser?.data?.id;
                if (userId) {
                  localStorage.setItem('userId', userId.toString());
                }
              } catch (error) {
                console.warn('Could not get userId from API for device registration:', error);
              }
            }
            
            // Set userId to 5 for testing (override any existing userId)
            userId = 5;
            localStorage.setItem('userId', '5');
            console.log('User ID set to 5 for testing');
            
            // Register device with userId 5
            // Check if device is already registered (avoid duplicate registrations)
            const lastRegistration = localStorage.getItem('deviceRegistrationTime');
            const lastRegistrationTime = lastRegistration ? parseInt(lastRegistration, 10) : 0;
            const now = Date.now();
            const registrationCooldown = 5 * 60 * 1000; // 5 minutes cooldown

            // Only register if not recently registered
            if (now - lastRegistrationTime > registrationCooldown) {
              try {
                await notificationService.registerDevice(userId);
                localStorage.setItem('deviceRegistrationTime', now.toString());
                console.log('Device auto-registered with backend (userId: 5)');
              } catch (error) {
                console.error('Failed to auto-register device:', error);
              }
            } else {
              console.log('Device auto-registration skipped (recently registered)');
            }
          }
        }

        // Listen for foreground messages
        const unsubscribe = onMessageListener((payload) => {
          console.log('Foreground message received:', payload);
          handleNotification(payload);
        });

        setIsInitialized(true);

        // Cleanup
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setIsInitialized(true);
      }
    };

    initializeNotifications();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (userId = null) => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        setPermission('granted');
        
        // Get userId if not provided
        // For testing, use userId 5
        let targetUserId = userId || authService.getUserId();
        
        // If userId not found, try to get from API
        if (!targetUserId && authService.isAuthenticated()) {
          try {
            const currentUser = await authService.getCurrentUser();
            targetUserId = currentUser?.userId || currentUser?.data?.userId || currentUser?.data?.id;
            if (targetUserId) {
              localStorage.setItem('userId', targetUserId.toString());
            }
          } catch (error) {
            console.warn('Could not get userId from API for device registration:', error);
          }
        }
        
        // Set userId to 5 for testing (override any existing userId)
        targetUserId = 5;
        localStorage.setItem('userId', '5');
        console.log('User ID set to 5 for testing');
        
        // Register device with userId 5
        // Check if device is already registered (avoid duplicate registrations)
        const lastRegistration = localStorage.getItem('deviceRegistrationTime');
        const lastRegistrationTime = lastRegistration ? parseInt(lastRegistration, 10) : 0;
        const now = Date.now();
        const registrationCooldown = 5 * 60 * 1000; // 5 minutes cooldown

        // Only register if not recently registered
        if (now - lastRegistrationTime > registrationCooldown) {
          try {
            await notificationService.registerDevice(targetUserId);
            localStorage.setItem('deviceRegistrationTime', now.toString());
            console.log('Device registered with backend (userId: 5)');
          } catch (error) {
            console.error('Failed to register device:', error);
          }
        } else {
          console.log('Device registration skipped (recently registered)');
        }
        
        return token;
      } else {
        setPermission(getNotificationPermission());
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setPermission(getNotificationPermission());
      return null;
    }
  }, []);
  
  // Register device with backend
  const registerDevice = useCallback(async (userId, deviceInfo = {}) => {
    try {
      const result = await notificationService.registerDevice(userId, deviceInfo);
      console.log('Device registered:', result);
      return result;
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }, []);

  // Handle incoming notification
  const handleNotification = useCallback((payload) => {
    const notification = {
      id: payload.messageId || Date.now().toString(),
      title: payload.notification?.title || payload.data?.title || 'New Notification',
      body: payload.notification?.body || payload.data?.body || '',
      icon: payload.notification?.icon || payload.data?.icon || null,
      image: payload.notification?.image || payload.data?.image || null,
      url: payload.data?.url || payload.notification?.click_action || null,
      data: payload.data || {},
      timestamp: new Date(),
      read: false
    };

    // Add notification to state
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show browser notification if permission is granted
    if (permission === 'granted' && payload.notification) {
      try {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          image: notification.image,
          badge: '/badge-72x72.png',
          tag: notification.id,
          data: notification.data,
          requireInteraction: false
        });
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
  }, [permission]);

  // Add notification manually (for testing or API-driven notifications)
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: notification.id || Date.now().toString(),
      title: notification.title || 'New Notification',
      body: notification.body || '',
      icon: notification.icon || null,
      image: notification.image || null,
      url: notification.url || null,
      data: notification.data || {},
      timestamp: new Date(notification.timestamp || Date.now()),
      read: notification.read || false
    };

    setNotifications((prev) => [newNotification, ...prev]);
    if (!newNotification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId && !notif.read
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((n) => !n.read);
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    permission,
    fcmToken,
    isInitialized,
    isSupported: isNotificationSupported(),
    requestPermission,
    registerDevice,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getUnreadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

