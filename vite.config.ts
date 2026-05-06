import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
  },
  // Ensure ESM-only deps are bundled at dev/server time so vitest/vite-node
  // don't attempt to require them as CJS. This is preferred over test.deps.inline
  // which vitest marks deprecated.
  server: {
    deps: { inline: ['vite', '@vitejs/plugin-react'] },
  },
  optimizeDeps: {
    include: ['vite', '@vitejs/plugin-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
