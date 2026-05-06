import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
// Mock the Supabase client before importing the module under test.
// Use an async factory to avoid hoisting issues with top-level variables.
vi.mock('@/lib/supabase', async () => {
  const mod = await import('../mocks/supabase')
  return {
    default: mod.supabaseMock,
    supabase: mod.supabaseMock,
  }
})

import AuthProvider from '@/lib/AuthProvider'
import { useAppStore } from '@/stores/appStore'
import { mockGetSessionError, mockPersonaResponse, mockSession, resetSupabaseMocks } from '../mocks/supabase'
import { resetAppStore } from '../mocks/useAppStore'

describe('AuthProvider', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    resetAppStore()
  })

  it('leaves user null and authLoading false when session is null', async () => {
    mockSession(null)

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    )

    expect(screen.getByText('child')).toBeInTheDocument()

    await waitFor(() => {
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().authLoading).toBe(false)
    })
  })

  it('treats missing persona as unauthenticated', async () => {
    mockSession({ user: { email: 'missing@example.com' } })
    mockPersonaResponse([])

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().authLoading).toBe(false)
    })
  })

  it('sets user when persona exists', async () => {
    mockSession({ user: { email: 'ana@example.com' } })
    mockPersonaResponse([
      { persona_id: 'p-1', nombre: 'Ana', rol: 'Curador' },
    ])

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(useAppStore.getState().user).toEqual({
        persona_id: 'p-1',
        nombre: 'Ana',
        rol: 'Curador',
      })
      expect(useAppStore.getState().authLoading).toBe(false)
    })
  })

  it('handles getSession error by clearing user and authLoading', async () => {
    mockGetSessionError(new Error('boom'))

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().authLoading).toBe(false)
    })
  })
})
