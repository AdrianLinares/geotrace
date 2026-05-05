import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    clearMocks: true,
    // Inline ESM-only deps so vitest/esbuild bundles them instead of requiring at runtime
    deps: { inline: ['vite', '@vitejs/plugin-react'] },
  },
})
