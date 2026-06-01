/**
 * PM2 production config — serves dist/ via `vite preview`, NOT the dev server.
 *
 * On the server:
 *   cd /var/www/alhal-admin
 *   npm ci
 *   npm run build
 *   pm2 delete adminalhal 2>/dev/null || true
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'adminalhal',
      cwd: __dirname,
      script: 'npm',
      args: 'run start:prod',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        VITE_DISABLE_AUTO_OPEN: 'true',
        // Fixed port for nginx proxy_pass (change if your reverse proxy uses another port)
        VITE_PORT: '3002',
      },
    },
  ],
}
