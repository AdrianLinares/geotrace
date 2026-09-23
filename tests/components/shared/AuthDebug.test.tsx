import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthDebug from '@/components/shared/AuthDebug'
import { useAppStore } from '@/stores/appStore'
import { resetAppStore } from '../../mocks/useAppStore'

const fetchMock = vi.fn()

describe('AuthDebug', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    resetAppStore()
  })

  it('uses /auth/me without querying Supabase data', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      user: { personaId: 'p-1', username: 'ana', name: 'Ana', roles: ['Curador'] },
    }), { status: 200 }))

    render(<AuthDebug />)
    fireEvent.click(screen.getByRole('button', { name: /debug auth/i }))

    await waitFor(() => expect(screen.getByText('Authenticated user: ana')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/auth/me', expect.anything())
    expect(screen.queryByText(/Supabase data/i)).not.toBeInTheDocument()
  })
})
