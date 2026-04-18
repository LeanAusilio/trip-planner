import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    root: __dirname,
    environment: 'jsdom',
    globals: true,
    setupFiles: path.resolve(__dirname, 'src/test-setup.js'),
  },
})
