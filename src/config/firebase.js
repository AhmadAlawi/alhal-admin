import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
// You can also use environment variables for security (recommended for production)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCw8NHAToyWwIDEczRb8k5hACjdzzc0Xng",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "alhalapp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "alhalapp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "alhalapp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "198760501842",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:198760501842:web:97f8c8a5ec98814be2458b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1P4F3JBL1P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error('Firebase Analytics initialization error:', error);
  }
}

// Initialize Firebase Cloud Messaging and get a reference to the service
// Only initialize in browser environment
// Note: Service worker should be registered separately (see main.jsx)
let messagingInstance = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messagingInstance = getMessaging(app);
  } catch (error) {
    console.error('Firebase Messaging initialization error:', error);
  }
}

// VAPID key for web push notifications
// Get this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
// This should be set in your .env file for security
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || null;

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null if permission denied
 */
export const requestNotificationPermission = async () => {
  if (!messagingInstance) {
    console.warn('Firebase Messaging is not available');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM token
      const currentToken = await getToken(messagingInstance, { vapidKey });
      
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Store token in localStorage
        localStorage.setItem('fcmToken', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token:', err);
    return null;
  }
};

/**
 * Get the current FCM token
 * @returns {Promise<string|null>} FCM token or null
 */
export const getFCMToken = async () => {
  if (!messagingInstance) {
    return null;
  }

  try {
    const currentToken = await getToken(messagingInstance, { vapidKey });
    return currentToken || localStorage.getItem('fcmToken') || null;
  } catch (err) {
    console.error('An error occurred while retrieving token:', err);
    return localStorage.getItem('fcmToken') || null;
  }
};

/**
 * Listen for foreground messages
 * @param {Function} callback - Callback function to handle messages
 * @returns {Function} Unsubscribe function
 */
export const onMessageListener = (callback) => {
  if (!messagingInstance) {
    return () => {};
  }

  const unsubscribe = onMessage(messagingInstance, (payload) => {
    console.log('Message received in foreground:', payload);
    callback(payload);
  });

  return unsubscribe;
};

/**
 * Check if notifications are supported
 * @returns {boolean} True if notifications are supported
 */
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Check notification permission status
 * @returns {string} 'default', 'granted', or 'denied'
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

export { app, analytics, messagingInstance as messaging };
export default app;

