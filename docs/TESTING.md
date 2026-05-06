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

7) Sample test template
Below is a minimal template you can copy when adding a new integration or unit test.

// Example: tests/lib/<Feature>.test.tsx
import React from 'react'
import { describe, it, beforeEach, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import vi from 'vitest'

// Mock supabase client used by the code under test
vi.mock('@/lib/supabase', async () => {
  const mod = await import('../mocks/supabase')
  return { default: mod.supabaseMock, supabase: mod.supabaseMock }
})

import ComponentUnderTest from '@/components/ComponentUnderTest'
import { resetSupabaseMocks, mockPersonaResponse, emitAuthStateChange } from '../mocks/supabase'
import { resetAppStore } from '../mocks/useAppStore'

describe('ComponentUnderTest', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    resetAppStore()
  })

  it('reacts to auth events and updates store', async () => {
    // Arrange: prepare mocked DB response expected by the component
    mockPersonaResponse([{ persona_id: 'p-1', nombre: 'Ana', rol: 'Curador' }])

    // Act: render component that registers auth listener
    render(<ComponentUnderTest />)

    // Ensure listener registered before emitting
    await waitFor(() => expect(require('../mocks/supabase').supabaseMock.auth.onAuthStateChange).toHaveBeenCalled())

    // Emit an auth event
    emitAuthStateChange('SIGNED_IN', { user: { email: 'ana@example.com' } })

    // Assert: component reacts and the store contains expected user
    await waitFor(() => {
      expect(screen.getByText(/Ana/)).toBeInTheDocument()
    })
  })
})


7) CI
- The GitHub Actions workflow runs `npm ci` and `npm run test` before build.

8) Troubleshooting
- If tests fail with ESM/CJS errors, ensure vitest.config.ts has proper
  resolve.alias for '@' -> 'src' and adjust server.deps.inline / optimizeDeps
  to include ESM-only dependencies.
- If vi.mock causes "Cannot access before initialization", use async factory
  pattern shown above.
