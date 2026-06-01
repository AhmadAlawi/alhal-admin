#!/usr/bin/env bash
# Build and restart PM2 production process (run on the server as root or deploy user).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Installing dependencies..."
npm ci

echo "==> Building production bundle..."
npm run build

if ! test -f dist/index.html; then
  echo "ERROR: dist/index.html missing after build" >&2
  exit 1
fi

echo "==> Restarting PM2 (production preview on dist/)..."
if pm2 describe adminalhal >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save
echo "Done. Check: pm2 logs adminalhal --lines 30"
