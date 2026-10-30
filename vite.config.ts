import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Analytics: Mark this project as created via create-cloudinary-react CLI
    'process.env.CLOUDINARY_SOURCE': '"cli"',
    'process.env.CLD_CLI': '"true"',
  },
  build: {
    rollupOptions: {
      output: {
        // Separate long-lived vendor chunks so an app change doesn't re-download them.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@cloudinary')) return 'cloudinary'
          if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return 'react'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
    // Fixed values so tests don't depend on a developer's .env.
    env: {
      VITE_CLOUDINARY_CLOUD_NAME: 'test-cloud',
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
})
