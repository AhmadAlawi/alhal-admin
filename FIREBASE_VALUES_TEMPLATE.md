# Firebase Configuration Values Template

Fill in these values from Firebase Console and then update your configuration files.

## 📝 Step 1: Get Values from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **rizaq-app-9b13f**
3. Go to **⚙️ Settings** → **Project settings**
4. Under **Your apps**, click on your **Web app** (or create one if it doesn't exist)
5. Copy the values below:

---

## 🔑 Required Values

### Web App Configuration

```javascript
apiKey: "_______________________"
// ⬆️ Copy from Firebase Console → Project Settings → Your apps → Web app → apiKey

messagingSenderId: "_______________________"
// ⬆️ Copy from Firebase Console → Project Settings → Your apps → Web app → messagingSenderId

appId: "_______________________"
// ⬆️ Copy from Firebase Console → Project Settings → Your apps → Web app → appId

measurementId: "_______________________"
// ⬆️ Copy from Firebase Console → Project Settings → Your apps → Web app → measurementId
// (Optional - only if you have Analytics enabled)
```

### Already Configured (You Don't Need to Change These)

```javascript
projectId: "rizaq-app-9b13f"  // ✅ Already correct
authDomain: "rizaq-app-9b13f.firebaseapp.com"  // ✅ Already correct
storageBucket: "rizaq-app-9b13f.firebasestorage.app"  // ✅ Already correct
```

### VAPID Key (Web Push)

```javascript
vapidKey: "_______________________"
// ⬆️ Copy from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Key pair
// You already have: BKIondeTQMjAtUoK-pca3Z3CEbouq4Lc4Nx_RsN1k2_uksManKN8fmEA_Vc8GMI5A7ZO16keWz7tI18jVMe7oJA
```

---

## 📋 Quick Checklist

- [ ] Firebase Console opened
- [ ] Project `rizaq-app-9b13f` selected
- [ ] Web app exists (if not, create one)
- [ ] `apiKey` copied
- [ ] `messagingSenderId` copied
- [ ] `appId` copied
- [ ] `measurementId` copied (optional)
- [ ] VAPID key verified/copied

---

## 🔧 Step 2: Update Configuration

Once you have the values above:

1. Open `src/config/firebase.js`
2. Replace the default values (currently: `"AIzaSyCw8NHAToyWwIDEczRb8k5hACjdzzc0Xng"`, etc.) with your actual values
3. Also update `public/firebase-messaging-sw.js` with the same values
4. Save and test

---

## 📍 Where to Find Each Value

### In Firebase Console:

```
Firebase Console
  └── ⚙️ Project Settings
      ├── General tab
      │   └── Your apps section
      │       └── Web app (</>)
      │           └── [Click on web app]
      │               └── Config object (copy apiKey, appId, messagingSenderId, measurementId)
      │
      └── Cloud Messaging tab
          └── Web Push certificates
              └── Key pair (copy VAPID public key)
```

---

## 💡 Tip

The 401 error usually means the **API key** is wrong. Make sure:
- ✅ You're using the API key from the **correct project** (`rizaq-app-9b13f`)
- ✅ You're using the API key from the **web app** configuration
- ✅ The web app is **registered** in Firebase Console

