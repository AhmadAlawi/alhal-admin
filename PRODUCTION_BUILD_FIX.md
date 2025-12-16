# Production Build Refresh Loop Fix

## Problem
The production build was causing infinite refresh loops due to:
1. React.StrictMode causing double renders
2. Service worker cache issues
3. ProtectedRoute authentication checks
4. API 401 redirects using `window.location.href`

## Fixes Applied

### 1. Disabled StrictMode in Production
- StrictMode now only runs in development
- Prevents double renders that can cause refresh loops

### 2. Improved Service Worker Management
- Always unregisters existing service workers first
- Registers new service worker only in production
- Uses `updateViaCache: 'none'` to always check for updates

### 3. Fixed ProtectedRoute
- Added cleanup function to prevent state updates after unmount
- Only re-checks auth when pathname changes
- Prevents infinite authentication loops

### 4. Fixed API Redirects
- Changed `window.location.href` to `window.location.replace()`
- Prevents adding to browser history and potential loops

## Building and Running Production

### Build
```bash
npm run build
```

### Preview Locally
```bash
npm run preview
```

### Serve with Node.js (if needed)
```bash
# Install serve globally
npm install -g serve

# Serve the dist folder
serve -s dist -l 3000
```

### Serve with Express (for production)
```javascript
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## Troubleshooting

### If refresh loop persists:

1. **Clear Browser Cache**
   - Open DevTools (F12)
   - Application tab → Clear Storage
   - Unregister all Service Workers

2. **Check Console for Errors**
   - Look for authentication errors
   - Check for API 401 responses
   - Verify no infinite redirects

3. **Verify Environment Variables**
   - Make sure `VITE_API_BASE_URL` is set correctly
   - Check that API is accessible

4. **Test in Incognito Mode**
   - Bypasses all cached data
   - Helps identify cache-related issues

5. **Check Network Tab**
   - Look for failed requests
   - Verify no redirect loops in network requests

## Additional Notes

- The app now uses `window.location.replace()` instead of `href` for redirects
- Service workers are properly managed to prevent cache issues
- React.StrictMode is disabled in production builds
- ProtectedRoute only checks auth when route changes
