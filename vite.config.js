import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false
  },
  define: {
    'process.env.ADMIN_PASSWORD': JSON.stringify(process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'gcsemijoias2025')
  }
})
