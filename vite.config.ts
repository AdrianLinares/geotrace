import path from 'path'

// Export an async config function to avoid top-level ESM imports that can
// cause Vitest/esbuild to attempt to require ESM-only packages like `vite`.
// When running under Vitest (process.env.VITEST), we skip importing the
// react plugin to prevent ESM resolution issues. For normal Vite runs the
// plugin is loaded dynamically.
export default async () => {
  let reactPlugin = undefined
  if (!process.env.VITEST) {
    // Dynamically import the plugin only for real Vite runs
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = await import('@vitejs/plugin-react')
    reactPlugin = mod.default()
  }

  return {
    plugins: reactPlugin ? [reactPlugin] : [],
    build: { target: 'es2020' },
    // Ensure ESM-only deps are bundled at dev/server time so vitest/vite-node
    // don't attempt to require them as CJS.
    server: {
      deps: { inline: ['vite', '@vitejs/plugin-react', '@supabase/supabase-js'] },
    },
    optimizeDeps: {
      include: ['vite', '@vitejs/plugin-react', '@supabase/supabase-js'],
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
  }
}
