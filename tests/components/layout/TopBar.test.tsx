import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TopBar from '@/components/layout/TopBar'
import { useAppStore } from '@/stores/appStore'
import { resetAppStore } from '../../mocks/useAppStore'

const fetchMock = vi.fn()

describe('TopBar logout', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    resetAppStore()
    useAppStore.setState({
      user: { persona_id: 'p-1', nombre: 'Ana', rol: 'Curador' },
      activeColeccion: 'coleccion-1',
    })
  })

  it('clears the active collection together with the user', async () => {
    render(<MemoryRouter><TopBar /></MemoryRouter>)

    fireEvent.click(document.querySelector('button') as HTMLElement)

    await waitFor(() => {
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().activeColeccion).toBeNull()
    })
  })
})
