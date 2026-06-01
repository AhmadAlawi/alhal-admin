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
    test: {
      globals: true,
      environment: 'jsdom',
      pool: 'threads',
      singleThread: true,
      testTimeout: 30000,
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/test/**', '**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
      },
    },
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
          // Split only heavy, non-React libraries. Do NOT isolate react into its own
          // chunk — vendor packages (echarts-for-react, react-leaflet, etc.) must share
          // the same React instance or createContext fails at runtime (blank screen).
          manualChunks: (id) => {
            if (id.includes('node_modules/echarts')) return 'echarts'
            if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
              return 'maps'
            }
            if (id.includes('node_modules/firebase')) return 'firebase'
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

