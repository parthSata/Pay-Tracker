import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        // target: 'http://localhost:5000',
        target: 'https://pay-tracker-k856.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
