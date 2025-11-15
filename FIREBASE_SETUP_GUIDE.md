# Firebase Setup Guide - How to Get All Required Credentials

This guide explains exactly what you need from Firebase and step-by-step instructions on how to get each credential.

---

## 📋 What You Need From Firebase

To set up Firebase Cloud Messaging (FCM) for push notifications, you need:

1. **Web App Configuration** (for Firebase SDK)
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
   - Measurement ID (optional, for Analytics)

2. **VAPID Keys** (for Web Push Notifications)
   - Public Key (VAPID Key)
   - Private Key (for backend only)

---

## 🚀 Step-by-Step: Getting Firebase Credentials

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **rizaq-app-9b13f**
   - If you don't see this project, you may need to create it first

### Step 2: Get Web App Configuration

1. In Firebase Console, click on the **⚙️ Settings (gear icon)** in the left sidebar
2. Select **Project settings**
3. Scroll down to the **Your apps** section
4. Look for a **Web app** (icon: `</>`)

   **If you DON'T have a web app:**
   - Click the **Add app** button
   - Select **Web** (`</>` icon)
   - Give it a nickname (e.g., "Admin Dashboard")
   - **Optionally** check "Also set up Firebase Hosting" (skip if you don't need it)
   - Click **Register app**
   - Copy the configuration object that appears

   **If you already have a web app:**
   - Click on the web app
   - You'll see the configuration values

### Step 3: Copy Web App Configuration Values

You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",              // ⬅️ Copy this
  authDomain: "rizaq-app-9b13f.firebaseapp.com",
  projectId: "rizaq-app-9b13f",      // ⬅️ Copy this
  storageBucket: "rizaq-app-9b13f.firebasestorage.app",
  messagingSenderId: "123456789012",  // ⬅️ Copy this
  appId: "1:123456789012:web:abc123", // ⬅️ Copy this
  measurementId: "G-XXXXXXXXXX"       // ⬅️ Copy this (optional)
};
```

**Copy these values:**
- ✅ `apiKey`
- ✅ `authDomain` (usually: `project-id.firebaseapp.com`)
- ✅ `projectId` (you already have: `rizaq-app-9b13f`)
- ✅ `storageBucket` (usually: `project-id.firebasestorage.app`)
- ✅ `messagingSenderId`
- ✅ `appId`
- ✅ `measurementId` (optional, for Analytics)

### Step 4: Get VAPID Keys for Web Push

1. In Firebase Console, go to **⚙️ Project settings**
2. Click on the **Cloud Messaging** tab
3. Scroll down to **Web Push certificates** section
4. You'll see:
   - **Key pair**: This is your **VAPID Public Key** (starts with `BK...`)
   - Click **Generate key pair** if you don't have one
   
5. **Copy the VAPID Key** (Public Key)
   - It looks like: `BKIondeTQMjAtUoK-pca3Z3CEbouq4Lc4Nx_RsN1k2_uksManKN8fmEA_Vc8GMI5A7ZO16keWz7tI18jVMe7oJA`
   - ⚠️ **Note**: The private key is NOT shown here. If you need it, you must save it when generating the key pair.

---

## 🔧 Updating Your Configuration

Once you have all the values, update them in your project:

### Option 1: Update `src/config/firebase.js` directly

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",              // ← Paste from Firebase Console
  authDomain: "rizaq-app-9b13f.firebaseapp.com",
  projectId: "rizaq-app-9b13f",
  storageBucket: "rizaq-app-9b13f.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID_HERE",  // ← Paste from Firebase Console
  appId: "YOUR_APP_ID_HERE",                 // ← Paste from Firebase Console
  measurementId: "YOUR_MEASUREMENT_ID"       // ← Paste from Firebase Console
};

const vapidKey = "YOUR_VAPID_KEY_HERE";      // ← Paste from Firebase Console
```

### Option 2: Use Environment Variables (Recommended for Production)

Create a `.env.local` file in your project root:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=rizaq-app-9b13f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rizaq-app-9b13f
VITE_FIREBASE_STORAGE_BUCKET=rizaq-app-9b13f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID_HERE
VITE_FIREBASE_APP_ID=YOUR_APP_ID_HERE
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

---

## 🔑 Important Notes

### API Key Restrictions (Recommended for Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **rizaq-app-9b13f**
3. Go to **APIs & Services** → **Credentials**
4. Find your API key and click on it
5. Under **Application restrictions**, select **HTTP referrers**
6. Add your domains:
   - `http://localhost:3000/*`
   - `https://yourdomain.com/*`
7. Under **API restrictions**, select **Restrict key**
8. Choose these APIs:
   - Firebase Cloud Messaging API
   - Firebase Installations API
   - Identity Toolkit API (if using Auth)

### VAPID Private Key

The VAPID private key you provided (`tdBe6C5k9agqMWfFopaVrKO0KtWa593dMnZRUvdKtYw`) should **ONLY** be used on your **backend server**, never in frontend code.

If you need to generate a new VAPID key pair:
- Generate it in Firebase Console → Cloud Messaging → Web Push certificates
- **Save the private key immediately** - you can only see it once!

---

## ✅ Quick Checklist

Use this checklist to ensure you have everything:

- [ ] Firebase project created: `rizaq-app-9b13f`
- [ ] Web app registered in Firebase Console
- [ ] `apiKey` copied
- [ ] `messagingSenderId` copied
- [ ] `appId` copied
- [ ] `measurementId` copied (optional)
- [ ] VAPID public key copied from Cloud Messaging settings
- [ ] Firebase configuration updated in `src/config/firebase.js`
- [ ] Service worker updated in `public/firebase-messaging-sw.js`

---

## 🐛 Troubleshooting

### Error: "Request is missing required authentication credential"

**Cause**: The API key is incorrect or doesn't belong to this project.

**Solution**:
1. Verify you're using the correct API key from the correct Firebase project
2. Make sure the web app is registered in Firebase Console
3. Check that Cloud Messaging API is enabled in Google Cloud Console

### Error: "Messaging service not available"

**Cause**: Firebase Messaging SDK can't initialize.

**Solution**:
1. Check browser console for detailed error messages
2. Verify all Firebase config values are correct
3. Make sure service worker is registered (check `public/firebase-messaging-sw.js`)

### VAPID Key Issues

**If you need to regenerate VAPID keys**:
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Scroll to Web Push certificates
3. Click "Generate key pair" (this will invalidate the old key)
4. Update your configuration with the new public key

---

## 📞 Need Help?

If you're still having issues:

1. **Check Firebase Console**: Make sure your project is set up correctly
2. **Check Browser Console**: Look for specific error messages
3. **Verify API Key**: Ensure it matches the one in Firebase Console
4. **Test in Incognito**: Sometimes browser cache causes issues

---

## 📝 Summary

The most common issue causing the 401 error is an **incorrect or missing API key**. Make sure:

1. ✅ You have a web app registered in Firebase Console
2. ✅ You're using the exact API key from that web app
3. ✅ All configuration values match what's in Firebase Console
4. ✅ The project ID matches (`rizaq-app-9b13f`)

Once you update the configuration with the correct values from Firebase Console, the error should be resolved!

