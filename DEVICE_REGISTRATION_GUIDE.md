# Device Registration Guide

## Overview

The device registration system automatically registers the user's device with the backend when they visit the dashboard. This allows the backend to send push notifications to the user's device.

## How It Works

### 1. Automatic Registration on Dashboard Load

When a user visits the dashboard, the system automatically:
1. Checks if notifications are initialized
2. Gets the user ID from localStorage or API
3. Checks if notification permission is granted
4. Registers the device if all conditions are met

### 2. Registration Flow

```
User visits Dashboard
    ↓
Check if notifications initialized
    ↓
Get userId (from localStorage or API)
    ↓
Check notification permission
    ↓
If granted → Get FCM token → Register device
If not granted → Wait for user to enable notifications
```

### 3. Registration Triggers

Device registration happens automatically in these scenarios:

1. **Dashboard Load** (if permission granted):
   - User visits dashboard
   - Notification permission is granted
   - FCM token is available
   - Device is registered automatically

2. **Notification Permission Granted**:
   - User enables notifications
   - NotificationContext automatically registers device
   - Device is registered with backend

3. **User Enables Notifications**:
   - User clicks "Enable Notifications" button
   - Permission is requested
   - After permission is granted, device is registered

### 4. Cooldown Mechanism

To prevent duplicate registrations, the system uses a cooldown mechanism:
- **Cooldown Period**: 5 minutes
- **Storage**: `deviceRegistrationTime` in localStorage
- **Behavior**: If device was registered within 5 minutes, registration is skipped

## Implementation Details

### Dashboard Component

The Dashboard component automatically registers the device when:
- User visits the dashboard
- Notifications are initialized
- User ID is available
- Notification permission is granted
- FCM token is available

```javascript
// Dashboard.jsx
useEffect(() => {
  const registerDeviceOnLoad = async () => {
    // Get userId
    let userId = authService.getUserId();
    
    // Get from API if not in localStorage
    if (!userId && authService.isAuthenticated()) {
      const currentUser = await authService.getCurrentUser();
      userId = currentUser?.userId || currentUser?.data?.userId;
    }
    
    // Register device if permission granted
    if (userId && permission === 'granted' && fcmToken) {
      await registerDevice(userId);
    }
  };
  
  registerDeviceOnLoad();
}, [registerDevice, fcmToken, permission, isInitialized]);
```

### Notification Context

The NotificationContext automatically registers the device when:
- Notification permission is granted
- FCM token is retrieved
- User ID is available

```javascript
// NotificationContext.jsx
if (currentPermission === 'granted') {
  const token = await getFCMToken();
  if (token) {
    const userId = authService.getUserId();
    if (userId) {
      await notificationService.registerDevice(userId);
    }
  }
}
```

## API Endpoint

The device registration uses the following endpoint:

```
POST /api/notifications/devices/register?userId={userId}
Content-Type: application/json
Authorization: Bearer {token}

Body: {
  "token": "fcm-token-here",
  "deviceType": "web",
  "deviceId": "web-1234567890-abc123",
  "deviceName": "Chrome on Windows",
  "appVersion": "1.0.0",
  "platform": "web"
}
```

## User ID Sources

The system tries to get the user ID from multiple sources:

1. **localStorage** (`userId` key)
2. **localStorage** (`user` object - parse JSON)
3. **API** (`/api/auth/me` endpoint)
4. **JWT Token** (if decoded)

## Device Information

The system automatically detects and sends:

- **deviceType**: Detected from user agent (web, android, ios)
- **deviceId**: Generated unique ID stored in localStorage
- **deviceName**: Detected from browser and OS
- **appVersion**: From `VITE_APP_VERSION` or default "1.0.0"
- **platform**: Default "web"

## Registration Scenarios

### Scenario 1: User Already Has Permission

1. User visits dashboard
2. NotificationContext initializes
3. Permission is already granted
4. FCM token is retrieved
5. Device is registered automatically
6. Dashboard confirms registration

### Scenario 2: User Doesn't Have Permission

1. User visits dashboard
2. NotificationContext initializes
3. Permission is not granted
4. User clicks "Enable Notifications"
5. Permission is requested
6. After permission granted, device is registered
7. Dashboard confirms registration

### Scenario 3: User ID Not Available

1. User visits dashboard
2. NotificationContext initializes
3. User ID is not in localStorage
4. System tries to get from API (`/api/auth/me`)
5. If successful, user ID is stored
6. Device is registered with retrieved user ID

## Cooldown Mechanism

The cooldown mechanism prevents duplicate registrations:

```javascript
const lastRegistration = localStorage.getItem('deviceRegistrationTime');
const lastRegistrationTime = lastRegistration ? parseInt(lastRegistration, 10) : 0;
const now = Date.now();
const registrationCooldown = 5 * 60 * 1000; // 5 minutes

if (now - lastRegistrationTime > registrationCooldown) {
  // Register device
  await registerDevice(userId);
  localStorage.setItem('deviceRegistrationTime', now.toString());
} else {
  // Skip registration (recently registered)
}
```

## Error Handling

The system handles errors gracefully:

1. **User ID Not Found**: Logs warning, doesn't crash
2. **FCM Token Not Available**: Waits for token, doesn't crash
3. **Permission Denied**: Logs info, doesn't crash
4. **API Error**: Logs error, doesn't crash
5. **Registration Failed**: Logs error, allows retry

## Testing

### Test Device Registration

1. **Visit Dashboard**:
   - Open browser console
   - Navigate to dashboard
   - Check console for registration logs

2. **Enable Notifications**:
   - Click notification bell icon
   - Click "Enable Notifications"
   - Check console for registration logs

3. **Check Registration**:
   - Check browser console for "Device registered successfully"
   - Check network tab for POST request to `/api/notifications/devices/register`
   - Check backend logs for device registration

### Manual Test

```javascript
// In browser console
import { useNotifications } from './contexts/NotificationContext';

const { registerDevice } = useNotifications();
await registerDevice(1); // Replace 1 with actual userId
```

## Troubleshooting

### Device Not Registering

1. **Check User ID**:
   - Verify userId is in localStorage
   - Check if API call to `/api/auth/me` is successful
   - Check browser console for userId logs

2. **Check Notification Permission**:
   - Verify permission is granted
   - Check browser notification settings
   - Try enabling notifications manually

3. **Check FCM Token**:
   - Verify FCM token is generated
   - Check browser console for token logs
   - Verify VAPID key is set correctly

4. **Check API Endpoint**:
   - Verify endpoint is correct
   - Check network tab for API calls
   - Verify authentication token is included

5. **Check Cooldown**:
   - Check if device was recently registered
   - Clear `deviceRegistrationTime` from localStorage to force registration
   - Wait 5 minutes between registrations

### Common Issues

1. **"User ID not found"**:
   - User may not be logged in
   - Check if auth token is valid
   - Try calling `/api/auth/me` manually

2. **"FCM token not available"**:
   - Notification permission may not be granted
   - Check browser notification settings
   - Verify VAPID key is set

3. **"Device registration failed"**:
   - Check API endpoint is correct
   - Verify authentication token is valid
   - Check backend logs for errors

4. **"Device registration skipped (recently registered)"**:
   - Device was registered within 5 minutes
   - This is normal behavior
   - Wait 5 minutes or clear localStorage

## Configuration

### Environment Variables

```env
# Firebase Configuration
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here

# App Version (optional)
VITE_APP_VERSION=1.0.0

# API Base URL
VITE_API_BASE_URL=https://localhost:7059
```

### Cooldown Period

The cooldown period can be adjusted in:
- `src/pages/Dashboard.jsx`
- `src/contexts/NotificationContext.jsx`

Change the `registrationCooldown` value:
```javascript
const registrationCooldown = 5 * 60 * 1000; // 5 minutes (adjust as needed)
```

## Best Practices

1. **User ID Storage**: Store userId in localStorage after login
2. **Error Handling**: Always handle errors gracefully
3. **Cooldown**: Use cooldown to prevent duplicate registrations
4. **Logging**: Log registration attempts for debugging
5. **User Feedback**: Provide user feedback when registration succeeds/fails

## Summary

The device registration system automatically registers devices when:
- User visits dashboard
- Notification permission is granted
- User ID is available
- FCM token is available

The system uses a cooldown mechanism to prevent duplicate registrations and handles errors gracefully.

## Next Steps

1. **Login Integration**: Store userId in localStorage after login
2. **User Feedback**: Show success/error messages to user
3. **Registration Status**: Display registration status in UI
4. **Settings Page**: Add device management in settings page
5. **Device List**: Show registered devices in user profile

