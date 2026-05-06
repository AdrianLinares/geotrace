import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AuthProvider from '@/lib/AuthProvider'
import { resetSupabaseMocks, mockSession, mockPersonaResponse, triggerAuthStateChange } from '../mocks/supabase'
import { snapshotAppStore, restoreAppStore, resetAppStore } from '../mocks/useAppStore'

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

    // Simulate sign in event with user email
    triggerAuthStateChange('SIGNED_IN', { user: { email: 'ana@example.com' } })
    mockPersonaResponse([{ persona_id: 'p-1', nombre: 'Ana', rol: 'Curador' }])

    await waitFor(() => {
      expect(screen.getByText('integracion')).toBeInTheDocument()
    })

    // The store should be populated with persona
    await waitFor(() => {
      const state = require('@/stores/appStore').useAppStore.getState()
      expect(state.user).toEqual({ persona_id: 'p-1', nombre: 'Ana', rol: 'Curador' })
    })
  })
})
