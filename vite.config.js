import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
  
  return {
    plugins: [react()],
    server: {
      port: port,
      open: true,
      host: true, // Allow external connections (accessible from network)
      strictPort: false, // Try next available port if port is in use
      allowedHosts: allowedHosts
    }
  }
})

