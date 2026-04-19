import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
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
