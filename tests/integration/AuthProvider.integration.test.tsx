import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', async () => {
  const mod = await import('../mocks/supabase')
  return {
    default: mod.supabaseMock,
    supabase: mod.supabaseMock,
  }
})

import AuthProvider from '@/lib/AuthProvider'
import { useAppStore } from '@/stores/appStore'
import {
  emitAuthStateChange,
  mockPersonaResponse,
  mockSession,
  resetSupabaseMocks,
} from '../mocks/supabase'
import { resetAppStore, snapshotAppStore } from '../utils/storeHelpers'

describe('AuthProvider integration', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    resetAppStore()
  })

  it('handles initial no-session and later sign-in flow', async () => {
    const initialSnapshot = snapshotAppStore()
    expect(initialSnapshot.user).toBeNull()
    expect(initialSnapshot.authLoading).toBe(true)

    mockSession(null)

    render(
      <AuthProvider>
        <div>contenido</div>
      </AuthProvider>
    )

    expect(screen.getByText('contenido')).toBeInTheDocument()

    await waitFor(() => {
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().authLoading).toBe(false)
    })

    mockPersonaResponse([
      { persona_id: 'p-99', nombre: 'Mora', rol: 'Curador' },
    ])

    emitAuthStateChange('SIGNED_IN', { user: { email: 'mora@example.com' } })

    await waitFor(() => {
      expect(useAppStore.getState().user).toEqual({
        persona_id: 'p-99',
        nombre: 'Mora',
        rol: 'Curador',
      })
      expect(useAppStore.getState().authLoading).toBe(false)
    })
  })

  it('keeps store clean between tests and does not trigger redirects', async () => {
    expect(useAppStore.getState().user).toBeNull()
    expect(useAppStore.getState().authLoading).toBe(true)

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

    expect(screen.queryByText('redirigir')).not.toBeInTheDocument()
  })

  it('renders children while persona is fetched on auth event', async () => {
    mockSession(null)
    mockPersonaResponse([
      { persona_id: 'p-77', nombre: 'Sofi', rol: 'Administrador' },
    ])

    render(
      <AuthProvider>
        <div>contenido seguro</div>
      </AuthProvider>
    )

    expect(screen.getByText('contenido seguro')).toBeInTheDocument()

    emitAuthStateChange('SIGNED_IN', { user: { email: 'sofi@example.com' } })

    await waitFor(() => {
      expect(useAppStore.getState().user).toEqual({
        persona_id: 'p-77',
        nombre: 'Sofi',
        rol: 'Administrador',
      })
      expect(useAppStore.getState().authLoading).toBe(false)
    })
  })

  it('ignores INITIAL_SESSION events', async () => {
    mockSession(null)

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    )

    emitAuthStateChange('INITIAL_SESSION', { user: { email: 'ignored@example.com' } })

    await waitFor(() => {
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().authLoading).toBe(false)
    })
  })

  it('ignores TOKEN_REFRESHED events', async () => {
    mockSession(null)

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    )

    emitAuthStateChange('TOKEN_REFRESHED', { user: { email: 'ignored@example.com' } })

    await waitFor(() => {
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().authLoading).toBe(false)
    })
  })
})
