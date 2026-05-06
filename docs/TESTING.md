Testing guide
--------------

This document explains how the project runs tests, how we mock Supabase and the global store,
and guidance for writing new unit and integration tests.

1) Test stack
- Vitest + @testing-library/react + @testing-library/jest-dom
- jsdom environment for browser-like DOM

2) Running tests
- Install dependencies: npm ci
- Run all tests: npx vitest --run
- Run a single file: npx vitest tests/lib/AuthProvider.test.tsx --run

3) Test setup
- vitest.config.ts sets: environment: 'jsdom', setupFiles: ['./tests/setup.ts']
- tests/setup.ts imports '@testing-library/jest-dom' and other globals

4) Mocking Supabase
- Tests use tests/mocks/supabase.ts — it exports `supabaseMock`, `mockSession`,
  `mockPersonaResponse`, `resetSupabaseMocks`, and `emitAuthStateChange`.
- In integration tests mock the real client: vi.mock('@/lib/supabase', async () => {
  const mod = await import('../mocks/supabase')
  return { default: mod.supabaseMock, supabase: mod.supabaseMock }
  })
- Important: ensure you call mockPersonaResponse BEFORE emitting auth events
  to avoid race conditions.

5) Mocking the App Store (Zustand)
- Use tests/mocks/useAppStore.ts helpers: resetAppStore(), snapshotAppStore(),
  restoreAppStore(snapshot).
- For integration tests, reset the store in beforeEach to avoid cross-test leak.

6) Writing new tests
- Prefer small, focused tests that mock external services.
- Unit tests: mock supabase and assert AuthProvider behaviors.
- Integration tests: mock supabase but interact with useAppStore to verify
  real state updates.

7) CI
- The GitHub Actions workflow runs `npm ci` and `npm run test` before build.

8) Troubleshooting
- If tests fail with ESM/CJS errors, ensure vitest.config.ts has proper
  resolve.alias for '@' -> 'src' and adjust server.deps.inline / optimizeDeps
  to include ESM-only dependencies.
- If vi.mock causes "Cannot access before initialization", use async factory
  pattern shown above.
