# Firebase Cloud Messaging (FCM) Setup Guide

This guide will help you set up Firebase Cloud Messaging for push notifications in the Al-Hal Admin Dashboard.

## Prerequisites

1. Firebase account
2. Firebase project created
3. Firebase Cloud Messaging enabled in your Firebase project

## Step 1: Install Dependencies

The Firebase SDK is already added to `package.json`. Install dependencies:

```bash
npm install
```

## Step 2: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (alhalapp)
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on the Web app icon (`</>`) if you haven't created one yet
6. Copy the Firebase configuration

The configuration is already set in `src/config/firebase.js` with your project details.

## Step 3: Get VAPID Key

1. In Firebase Console, go to Project Settings
2. Click on the "Cloud Messaging" tab
3. Scroll down to "Web Push certificates"
4. If you don't have a key pair, click "Generate key pair"
5. Copy the key pair (VAPID key)

## Step 4: Configure Environment Variables

Create or update your `.env` file in the root directory:

```env
# Firebase Configuration (optional, already set in firebase.js)
VITE_FIREBASE_API_KEY=AIzaSyCw8NHAToyWwIDEczRb8k5hACjdzzc0Xng
VITE_FIREBASE_AUTH_DOMAIN=alhalapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=alhalapp
VITE_FIREBASE_STORAGE_BUCKET=alhalapp.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=198760501842
VITE_FIREBASE_APP_ID=1:198760501842:web:97f8c8a5ec98814be2458b
VITE_FIREBASE_MEASUREMENT_ID=G-1P4F3JBL1P

# Firebase VAPID Key (required for web push notifications)
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

**Important:** Replace `YOUR_VAPID_KEY_HERE` with your actual VAPID key from Firebase Console.

## Step 5: Service Worker Setup

The service worker file is already created at `public/firebase-messaging-sw.js`. It will automatically be registered when the app loads.

**Important:** The service worker must be served from the root of your domain (e.g., `https://yourdomain.com/firebase-messaging-sw.js`).

## Step 6: Test Notifications

1. Start your development server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to the app
3. Click on the notification bell icon in the header
4. Click "Enable Notifications" if prompted
5. Allow notifications when the browser asks for permission
6. Check the browser console for the FCM token

## Step 7: Send Test Notification

### Option 1: Using Firebase Console

1. Go to Firebase Console > Cloud Messaging
2. Click "Send test message"
3. Enter your FCM token (from browser console)
4. Enter notification title and body
5. Click "Test"

### Option 2: Using Backend API

You can send notifications from your backend using the FCM Admin SDK or REST API.

## Step 8: Backend Integration

To integrate with your backend API, use the notification service:

```javascript
import notificationService from './services/notificationService';
import { useNotifications } from './contexts/NotificationContext';

// Option 1: Register device with device information (recommended)
const userId = 1; // Get from your auth system
await notificationService.registerDevice(userId, {
  token: fcmToken, // Optional, will fetch automatically if not provided
  deviceType: 'web', // Optional, will detect automatically
  deviceId: 'unique-device-id', // Optional, will generate if not provided
  deviceName: 'Chrome on Windows', // Optional, will detect automatically
  appVersion: '1.0.0', // Optional, default is '1.0.0'
  platform: 'web' // Optional, default is 'web'
});

// Option 2: Register device automatically (uses auto-detected device info)
await notificationService.registerDevice(userId);

// Option 3: Using notification context (recommended)
const { requestPermission, registerDevice } = useNotifications();

// Request permission and register device
await requestPermission(userId); // Automatically registers device if userId provided

// Or register device manually
await registerDevice(userId);

// Get user notifications
const notifications = await notificationService.getNotifications(userId);

// Mark notification as read
await notificationService.markAsRead(notificationId);
```

## Features

### Notification Context

The `NotificationProvider` provides:
- Notification state management
- FCM token management
- Permission handling
- Foreground message handling
- Notification list management

### Notification Component

The `Notifications` component provides:
- Notification dropdown
- Unread count badge
- Mark as read/unread
- Delete notifications
- Permission request UI

### Service Worker

The service worker handles:
- Background message delivery
- Notification display
- Notification click handling
- Notification close handling

## API Endpoints (Backend)

Your backend should implement these endpoints:

### Device Registration

```
POST /api/notifications/devices/register?userId={userId}
Content-Type: application/json

Body: {
  "token": "fcm-token-here",
  "deviceType": "web" | "android" | "ios",
  "deviceId": "unique-device-id",
  "deviceName": "Chrome on Windows",
  "appVersion": "1.0.0",
  "platform": "web" | "mobile"
}
```

### Other Endpoints

```
POST /api/notifications/devices/unregister?userId={userId}
  Body: { token, deviceId }

GET /api/notifications/user/:userId
  Query: { page, pageSize, read }

PATCH /api/notifications/:id/read

PATCH /api/notifications/user/:userId/read-all

DELETE /api/notifications/:id

GET /api/notifications/user/:userId/settings

PUT /api/notifications/user/:userId/settings
  Body: { settings }
```

### Device Information

The notification service automatically detects and sends:
- **deviceType**: Detected from user agent (web, android, ios)
- **deviceId**: Generated unique ID stored in localStorage
- **deviceName**: Detected from browser and OS (e.g., "Chrome on Windows")
- **appVersion**: From environment variable `VITE_APP_VERSION` or default "1.0.0"
- **platform**: "web" for web apps, "mobile" for mobile apps

## Troubleshooting

### Service Worker Not Registering

1. Make sure the service worker file is in the `public` directory
2. Check that the file is accessible at `/firebase-messaging-sw.js`
3. Check browser console for errors
4. Make sure you're using HTTPS (or localhost for development)

### Notifications Not Showing

1. Check browser notification permissions
2. Make sure notifications are enabled in browser settings
3. Check that VAPID key is correctly set
4. Check browser console for errors
5. Make sure Firebase Cloud Messaging is enabled in Firebase Console

### FCM Token Not Generated

1. Check that notification permission is granted
2. Check that VAPID key is set correctly
3. Check browser console for errors
4. Make sure service worker is registered

### Background Notifications Not Working

1. Check that service worker is registered
2. Check that service worker file is correct
3. Check browser console for service worker errors
4. Make sure notifications are sent as "data" messages for background handling

## Browser Compatibility

Firebase Cloud Messaging works in:
- Chrome (desktop and mobile)
- Firefox (desktop and mobile)
- Edge (desktop and mobile)
- Safari (iOS 16.4+ with push support)
- Opera (desktop and mobile)

## Security Considerations

1. **VAPID Key**: Store the VAPID key in environment variables, not in code
2. **FCM Token**: Store FCM tokens securely on your backend
3. **HTTPS**: Use HTTPS in production (required for service workers)
4. **Permissions**: Always request user permission before sending notifications

## Production Deployment

1. Make sure `.env` file is not committed to version control
2. Set environment variables in your hosting platform
3. Make sure service worker is accessible at root path
4. Enable HTTPS
5. Test notifications in production environment

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Support

If you encounter any issues, check:
1. Browser console for errors
2. Service worker registration status
3. Firebase Console for message delivery status
4. Network tab for API requests

For more help, refer to the Firebase documentation or contact support.

