import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    clearMocks: true,
    deps: { inline: ['vite', '@vitejs/plugin-react'] },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
