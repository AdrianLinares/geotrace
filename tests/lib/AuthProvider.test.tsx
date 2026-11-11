import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthProvider from '@/lib/AuthProvider'
import { useAppStore } from '@/stores/appStore'
import { resetAppStore } from '../mocks/useAppStore'

const fetchMock = vi.fn()

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    resetAppStore()
  })

  it('clears the user after an unauthenticated /auth/me response', async () => {
    fetchMock.mockResolvedValue(response(401, { error: 'Authentication required' }))

    render(<AuthProvider><div>child</div></AuthProvider>)

    await waitFor(() => {
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().authLoading).toBe(false)
    })
    expect(fetchMock).toHaveBeenCalledWith('/auth/me', expect.objectContaining({ credentials: 'include' }))
  })

  it('restores the backend user after a successful /auth/me response', async () => {
    fetchMock.mockResolvedValue(response(200, {
      user: { personaId: 'p-1', username: 'ana', name: 'Ana', roles: ['Curador'] },
    }))

    render(<AuthProvider><div>child</div></AuthProvider>)

    expect(screen.getByText('child')).toBeInTheDocument()
    await waitFor(() => expect(useAppStore.getState().user).toEqual({
      persona_id: 'p-1',
      nombre: 'Ana',
      rol: 'Curador',
      roles: ['Curador'],
    }))
    expect(useAppStore.getState().authLoading).toBe(false)
  })

  it('rejects a /auth/me user without roles as unauthenticated', async () => {
    fetchMock.mockResolvedValue(response(200, {
      user: { personaId: 'p-1', username: 'ana', name: 'Ana', roles: [] },
    }))

    render(<AuthProvider><div>child</div></AuthProvider>)

    await waitFor(() => {
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().authLoading).toBe(false)
    })
  })
})
