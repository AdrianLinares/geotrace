Integration test notes

- The AuthProvider integration test mocks the supabase client via
  vi.mock('@/lib/supabase', async () => import('../mocks/supabase'))
- Ensure that tests/mocks/supabase.ts exports `supabaseMock`, `emitAuthStateChange`,
  and the query builder helpers (mockPersonaResponse, mockSession).

Run: npx vitest tests/integration --run
