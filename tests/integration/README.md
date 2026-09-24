Integration test notes

- The AuthProvider integration test mocks the local authentication API.
- Keep network calls mocked at the `src/lib/authApi.ts` boundary.

Run: npx vitest tests/integration --run
