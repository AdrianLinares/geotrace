import { describe, expect, it, vi } from 'vitest'
import { apiRequest, ApiError } from '../../src/lib/api'

describe('apiRequest', () => {
  it('uses the session cookie and decodes successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 })))
    await expect(apiRequest('/api/collections')).resolves.toEqual({ data: [] })
    expect(fetch).toHaveBeenCalledWith('/api/collections', expect.objectContaining({ credentials: 'include' }))
  })

  it('surfaces API status and message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 })))
    await expect(apiRequest('/api/collections')).rejects.toMatchObject<ApiError>({ status: 401, message: 'Authentication required' })
  })
})
