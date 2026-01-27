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
        '127.0.0.1',
        'admin.sooq-alhal.com'
      ]
  
  // Disable auto-open browser in server/CI environments
  // Check if running in a headless environment (no display/GUI)
  const isServerEnvironment = process.env.CI || 
                              process.env.PM2_HOME || 
                              !process.stdout.isTTY ||
                              process.env.SSH_CONNECTION ||
                              env.VITE_DISABLE_AUTO_OPEN === 'true'
  
  return {
    plugins: [
      react({
        // Ensure React is properly handled by the plugin
        jsxRuntime: 'automatic',
      })
    ],
    resolve: {
      alias: {
        // Ensure React is resolved to a single instance
        'react': path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom'], // Deduplicate React instances
      // Ensure consistent module resolution
      preserveSymlinks: false,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'], // Pre-bundle React for faster dev server
      // Note: esbuildOptions.resolve is not valid - use top-level resolve.alias instead
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
          },
          // Ensure React and React-DOM are in a single chunk to prevent multiple instances
          manualChunks: (id) => {
            // More aggressive matching for React packages - must come first
            if (
              id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react/jsx-runtime') ||
              id.includes('node_modules/react/jsx-dev-runtime') ||
              id.includes('node_modules/react/index') ||
              id.includes('node_modules/react-dom/index')
            ) {
              return 'react-vendor';
            }
            // Put react-router-dom with React to ensure compatibility
            if (id.includes('node_modules/react-router-dom/')) {
              return 'react-vendor';
            }
            // Put other node_modules in separate chunks
            if (id.includes('node_modules/')) {
              return 'vendor';
            }
          },
          // Ensure proper chunk format for better module sharing
          format: 'es',
          // Ensure consistent chunk naming
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      },
      // Ensure common chunks are properly shared
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      },
      // Increase chunk size warning limit (React can be large)
      chunkSizeWarningLimit: 1000,
      // Ensure proper minification that preserves module structure
      minify: 'esbuild',
      // Target modern browsers for better tree-shaking
      target: 'esnext',
      // Ensure proper module format
      modulePreload: {
        polyfill: true
      }
    }
  }
})

