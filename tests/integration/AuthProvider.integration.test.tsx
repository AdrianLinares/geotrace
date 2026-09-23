import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthProvider from '@/lib/AuthProvider'
import { useAppStore } from '@/stores/appStore'
import { resetAppStore } from '../mocks/useAppStore'

const fetchMock = vi.fn()

describe('AuthProvider backend integration boundary', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    resetAppStore()
  })

  it('uses the HttpOnly-cookie session endpoint without Supabase auth events', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      user: { personaId: 'p-1', username: 'ana', name: 'Ana', roles: ['Curador'] },
    }), { status: 200 }))

    render(<AuthProvider><div>integration</div></AuthProvider>)

    await waitFor(() => expect(useAppStore.getState().user?.persona_id).toBe('p-1'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
