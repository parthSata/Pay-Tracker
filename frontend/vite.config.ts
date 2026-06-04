import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      TanStackRouterVite(),
      react(),
      tsconfigPaths(),
      tailwindcss(),
    ],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://pay-tracker-k856.onrender.com/api/v1'),
    },
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
  };
})
