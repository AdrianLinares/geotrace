import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMuestras } from '../../src/hooks/useMuestras'
import { apiRequest } from '../../src/lib/api'

vi.mock('../../src/lib/api', () => ({ apiRequest: vi.fn() }))

describe('useMuestras', () => {
  it('does not query or fabricate a plate filter when the schema lacks the relationship', () => {
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useMuestras(0, '4'), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })

    expect(result.current.isPlateFilterUnsupported).toBe(true)
    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('lists unfiltered samples without sending the legacy placa_id parameter', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({ data: [], total: 0 })
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useMuestras(1), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiRequest).toHaveBeenCalledWith('/api/samples?page=1&pageSize=20')
  })
})
