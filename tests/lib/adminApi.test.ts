import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminApiError, updateManagedPerson } from '@/lib/adminApi'
import { reconcileSessionAfterAdminMutation } from '@/lib/adminApi'
import { useAppStore } from '@/stores/appStore'

const fetchMock = vi.fn()

describe('administrator API client', () => {
  beforeEach(() => { vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset() })

  it.each([[401, 'Authentication required'], [403, 'Administrator access required'], [409, 'The change conflicts with a required account rule']] as const)('maps %s without exposing server details', async (status, message) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'database secret' }), { status }))
    await expect(updateManagedPerson('1', { activo: false })).rejects.toEqual(new AdminApiError(status, message))
  })

  it('checks /auth/me after a successful mutation and redirects after session invalidation', async () => {
    useAppStore.setState({
      user: { persona_id: 'p-1', nombre: 'Ana', rol: 'Administrador' },
      activeColeccion: 'collection-1',
    })
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ persona_id: 'p-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 }))
    const redirect = vi.fn()

    await updateManagedPerson('p-1', { activo: false })
    await reconcileSessionAfterAdminMutation(redirect)

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(['/api/admin/personas/p-1', '/auth/me'])
    expect(useAppStore.getState().user).toBeNull()
    expect(useAppStore.getState().activeColeccion).toBeNull()
    expect(redirect).toHaveBeenCalledWith('/login', { replace: true })
  })
})
