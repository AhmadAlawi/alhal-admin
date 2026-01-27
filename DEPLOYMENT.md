# Production Deployment Guide

## Critical: Serving Production Build

Your production server must serve files from the `dist` directory, NOT the source files.

## The Problem

If you see errors like:
```
GET /node_modules/.vite/deps/react.js net::ERR_ABORTED 504
```

This means your server is trying to serve development files instead of the production build.

## Solution

### Step 1: Build the Production Bundle

```bash
npm run build
```

This creates optimized files in the `dist/` directory.

### Step 2: Configure Your Web Server

Your web server (nginx, Apache, etc.) must point to the `dist` directory.

#### For Nginx:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name admin.sooq-alhal.com;
    
    # SSL configuration (if using HTTPS)
    # ssl_certificate /path/to/certificate.crt;
    # ssl_certificate_key /path/to/private.key;
    
    root /var/www/Rizaq/alhal-admin/dist;
    index index.html;
    
    # MIME types - Critical for ES modules (fixes "Expected a JavaScript module" error)
    types {
        application/javascript js mjs;
        text/css css;
        text/html html htm;
        image/svg+xml svg;
        application/json json;
        application/wasm wasm;
    }
    
    # Default MIME type
    default_type application/octet-stream;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Prevent caching of index.html
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        
        # Ensure correct MIME types for module scripts
        types {
            application/javascript js mjs;
            text/css css;
            application/wasm wasm;
        }
        default_type application/javascript;
    }
    
    # Block access to node_modules (security)
    location ~ /node_modules/ {
        deny all;
        return 404;
    }
    
    # Block access to source files
    location ~ /src/ {
        deny all;
        return 404;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
```

#### For Apache (.htaccess in dist folder):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Step 3: Verify the Build

After building, check that `dist/index.html` contains references to `/assets/` files, NOT `/src/`:

✅ **Correct (Production):**
```html
<script type="module" crossorigin src="/assets/index-XXXXX.js"></script>
```

❌ **Wrong (Development):**
```html
<script type="module" src="/src/main.jsx"></script>
```

### Step 4: Restart Your Web Server

After configuring, restart your web server:

```bash
# Nginx
sudo systemctl restart nginx

# Apache
sudo systemctl restart apache2
```

## Common Mistakes

### ❌ Running Dev Server in Production
```bash
# DON'T DO THIS in production
npm run dev
```

### ✅ Serving Static Files
```bash
# DO THIS - serve from dist directory
# Configure your web server to point to dist/
```

### ❌ Pointing to Wrong Directory
Make sure your web server root is:
```
/path/to/alhal-admin/dist
```

NOT:
```
/path/to/alhal-admin
/path/to/alhal-admin/src
```

## Quick Check

1. **Rebuild the application:**
   ```bash
   npm run build
   ```

2. **Verify build output:**
   ```bash
   # Check that dist/index.html exists and references /assets/
   cat /var/www/Rizaq/alhal-admin/dist/index.html
   ```
   Should show: `<script type="module" crossorigin src="/assets/index-XXXXX.js"></script>`
   
   Should NOT show: `<script type="module" src="/src/main.jsx"></script>`

3. **Verify assets directory exists:**
   ```bash
   ls -la /var/www/Rizaq/alhal-admin/dist/assets/
   ```
   Should show `.js` and `.css` files.

4. **Update nginx config** (see `nginx.conf.example` for full config):
   - Add blocks for `/node_modules/` and `/src/` directories
   - Add cache headers for `index.html`
   - Restart nginx: `sudo systemctl restart nginx`

5. **Clear all caches:**
   ```bash
   # Clear nginx cache (if any)
   sudo rm -rf /var/cache/nginx/*
   
   # Clear browser cache:
   # - Chrome/Edge: Ctrl+Shift+Delete
   # - Firefox: Ctrl+Shift+Delete
   # - Or use Incognito/Private mode
   ```

6. **Test in browser:**
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Disable cache"
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Troubleshooting

### Still seeing 504 errors?

1. **Verify build completed successfully:**
   ```bash
   ls -la dist/assets/
   ```
   Should show `.js` and `.css` files.

2. **Check web server configuration:**
   - Root directory must be `dist/`
   - Not the project root
   - Not `src/`

3. **Check file permissions:**
   ```bash
   chmod -R 755 dist/
   ```

4. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## PM2 Deployment (Alternative)

If using PM2 to serve the app:

```bash
# Install serve
npm install -g serve

# Serve production build
serve -s dist -l 3000
```

But it's better to use a proper web server (nginx/Apache) for production.
