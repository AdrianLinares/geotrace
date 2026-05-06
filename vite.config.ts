import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
  },
  // Ensure ESM-only deps are bundled at dev/server time so vitest/vite-node
  // don't attempt to require them as CJS.
  server: {
    deps: { inline: ['vite', '@vitejs/plugin-react', '@supabase/supabase-js'] },
  },
  optimizeDeps: {
    include: ['vite', '@vitejs/plugin-react', '@supabase/supabase-js'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
