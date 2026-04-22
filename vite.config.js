import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'wayfar-logo-light.svg'],
      manifest: {
        name: 'Wayfar',
        short_name: 'Wayfar',
        description: 'Plan and share your trips',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /nominatim\.openstreetmap\.org/,
            handler: 'CacheFirst',
            options: { cacheName: 'nominatim', expiration: { maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: /api\.open-meteo\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'weather', expiration: { maxAgeSeconds: 3600 } },
          },
          {
            urlPattern: /supabase\.co/,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase', networkTimeoutSeconds: 10 },
          },
        ],
      },
    }),
  ],
  build: {
    // Target Safari 13 (iOS 13.4+) to transpile private class fields
    // and other ES2020+ syntax used by @supabase/supabase-js
    target: ['es2019', 'safari13'],
  },
  test: {
    root: __dirname,
    environment: 'jsdom',
    globals: true,
    setupFiles: path.resolve(__dirname, 'src/test-setup.js'),
  },
})

