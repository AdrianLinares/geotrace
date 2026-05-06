import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AuthProvider from '@/lib/AuthProvider'
import { resetSupabaseMocks, mockSession, mockPersonaResponse, emitAuthStateChange } from '../mocks/supabase'
import { snapshotAppStore, restoreAppStore, resetAppStore } from '../mocks/useAppStore'
import { useAppStore } from '@/stores/appStore'

describe('AuthProvider integration', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    resetAppStore()
  })

  it('handles sign-in event and updates store with persona', async () => {
    // Start with no session
    mockSession(null)

    render(
      <AuthProvider>
        <div>integracion</div>
      </AuthProvider>
    )

    // Prepare persona response before emitting the sign-in event so the
    // provider's fetchPersonaAndSet finds the mocked data immediately.
    mockPersonaResponse([{ persona_id: 'p-1', nombre: 'Ana', rol: 'Curador' }])
    // Simulate sign in event with user email
    emitAuthStateChange('SIGNED_IN', { user: { email: 'ana@example.com' } })

    await waitFor(() => {
      expect(screen.getByText('integracion')).toBeInTheDocument()
    })

    // The store should be populated with persona
    await waitFor(() => {
      const state = useAppStore.getState()
      expect(state.user).toEqual({ persona_id: 'p-1', nombre: 'Ana', rol: 'Curador' })
    })
  })
})
