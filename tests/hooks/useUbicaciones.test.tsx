import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useUbicaciones } from '../../src/hooks/useUbicaciones'
import { apiRequest } from '../../src/lib/api'

vi.mock('../../src/lib/api', () => ({ apiRequest: vi.fn() }))

describe('useUbicaciones', () => {
  it('uses the local API and normalized filters', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({ data: [], total: 0 })
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useUbicaciones(1, { search: 'A', occupied: false, sectionId: '3' }), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiRequest).toHaveBeenCalledWith('/api/physical-locations?page=1&pageSize=50&search=A&occupied=false&sectionId=3')
  })
})
