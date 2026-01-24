import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get port from environment variable or use default
  const port = parseInt(env.VITE_PORT || env.PORT || '3000', 10)
  
  // Get allowed hosts from environment or use defaults
  const allowedHostsEnv = env.VITE_ALLOWED_HOSTS
  const allowedHosts = allowedHostsEnv 
    ? allowedHostsEnv.split(',').map(h => h.trim())
    : [
        'adminalhal.awnak.net',
        'localhost',
        '.localhost',
        '127.0.0.1'
      ]
  
  // Disable auto-open browser in server/CI environments
  // Check if running in a headless environment (no display/GUI)
  const isServerEnvironment = process.env.CI || 
                              process.env.PM2_HOME || 
                              !process.stdout.isTTY ||
                              process.env.SSH_CONNECTION ||
                              env.VITE_DISABLE_AUTO_OPEN === 'true'
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Ensure React is resolved to a single instance
        'react': path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom'], // Deduplicate React instances
    },
    optimizeDeps: {
      include: ['react', 'react-dom'], // Pre-bundle React for faster dev server
    },
    server: {
      port: port,
      open: !isServerEnvironment, // Only open browser in local development
      host: true, // Allow external connections (accessible from network)
      strictPort: false, // Try next available port if port is in use
      allowedHosts: allowedHosts
    },
    publicDir: 'public',
    build: {
      rollupOptions: {
        output: {
          // Ensure service worker is copied to build output
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'firebase-messaging-sw.js') {
              return 'firebase-messaging-sw.js';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      }
    }
  }
})

