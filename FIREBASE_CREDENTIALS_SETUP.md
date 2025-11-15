# Firebase Credentials Setup

## ✅ Configuration Completed

The Firebase configuration has been updated with the following credentials:

### Project Information
- **Project ID**: `rizaq-app-9b13f`
- **Auth Domain**: `rizaq-app-9b13f.firebaseapp.com`
- **Storage Bucket**: `rizaq-app-9b13f.firebasestorage.app`

### VAPID Keys (Web Push Notifications)
- **Public Key**: `BKIondeTQMjAtUoK-pca3Z3CEbouq4Lc4Nx_RsN1k2_uksManKN8fmEA_Vc8GMI5A7ZO16keWz7tI18jVMe7oJA`
- **Private Key**: `tdBe6C5k9agqMWfFopaVrKO0KtWa593dMnZRUvdKtYw`

> ⚠️ **Important**: The private key is for backend use only. It should NEVER be exposed in frontend code or committed to version control.

## 📁 Files Updated

1. **src/config/firebase.js**
   - Updated project ID and auth domain
   - Added VAPID public key as default value

2. **public/firebase-messaging-sw.js**
   - Updated service worker with new project configuration

## 🔐 Service Account (Backend Only)

The Firebase service account JSON should be stored securely on your backend server only:

```json
{
  "type": "service_account",
  "project_id": "rizaq-app-9b13f",
  "private_key_id": "cc39ee14b6d8aac562aef6c820fa7293701b286f",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@rizaq-app-9b13f.iam.gserviceaccount.com",
  ...
}
```

### Backend Usage

Use this service account in your backend to:
- Send push notifications to devices
- Admin operations (user management, etc.)
- Server-side Firebase Admin SDK operations

### Security Notes

1. **Never commit** the service account JSON file to Git
2. Store it securely on your backend server
3. Use environment variables for sensitive credentials
4. The private key should only be used server-side

## 🔧 Environment Variables (Optional)

You can override the default values by creating a `.env.local` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=rizaq-app-9b13f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rizaq-app-9b13f
VITE_FIREBASE_STORAGE_BUCKET=rizaq-app-9b13f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=BKIondeTQMjAtUoK-pca3Z3CEbouq4Lc4Nx_RsN1k2_uksManKN8fmEA_Vc8GMI5A7ZO16keWz7tI18jVMe7oJA
```

## ✅ Next Steps

1. Verify the Firebase web app configuration in Firebase Console
2. Update any missing values (API key, App ID, etc.) if needed
3. Test notification registration using the device registration button in Settings
4. Configure your backend to use the service account for sending notifications

