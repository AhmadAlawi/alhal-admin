# How to Fix Browser Cache Issues

If you're experiencing issues where the app keeps refreshing or tries to load from a production URL, follow these steps:

## Quick Fix (Recommended)

### Step 1: Clear Browser Cache and Service Workers

#### Chrome/Edge:
1. Open Developer Tools (F12)
2. Go to **Application** tab
3. Click **Clear storage** in the left sidebar
4. Check all boxes
5. Click **Clear site data**
6. Go to **Service Workers** in the left sidebar
7. Click **Unregister** for any registered service workers
8. Close and reopen the browser

#### Firefox:
1. Open Developer Tools (F12)
2. Go to **Storage** tab
3. Right-click on the domain and select **Delete All**
4. Go to **Service Workers** tab
5. Unregister any service workers
6. Close and reopen the browser

### Step 2: Hard Refresh
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### Step 3: Start Dev Server
```bash
npm run dev
```

The app should now load from `http://localhost:3000` (or your configured port).

## Alternative: Use Incognito/Private Mode

1. Open a new incognito/private window
2. Navigate to `http://localhost:3000`
3. This bypasses all cached data

## If Issues Persist

### Clear Vite Cache
```bash
# Delete Vite cache
rm -rf node_modules/.vite

# On Windows PowerShell:
Remove-Item -Recurse -Force node_modules\.vite

# Restart dev server
npm run dev
```

### Check Your Environment
Make sure you're accessing the app via:
- `http://localhost:3000` (not https://admin.sooq-alhal.com)
- The port shown in your terminal when you run `npm run dev`

### Verify Service Worker is Unregistered
1. Open Developer Tools (F12)
2. Go to **Application** tab → **Service Workers**
3. Make sure no service workers are registered
4. If any are registered, click **Unregister**

## Prevention

The code has been updated to automatically unregister service workers in development mode. This prevents future cache issues during development.
