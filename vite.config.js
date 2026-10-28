import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // During development the frontend (5173) and the API (3000) run on
    // different origins. Proxy every /api request to Flask so that relative
    // calls such as /api/recent-logs reach the JSON endpoint instead of the
    // Vite dev server SPA fallback (index.html).
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
