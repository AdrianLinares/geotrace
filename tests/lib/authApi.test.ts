import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthApiError, getMe, login, logout, toAppUser } from '@/lib/authApi'

const fetchMock = vi.fn()

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('auth API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  it('logs in with credentials and includes cookies', async () => {
    const user = { personaId: 'p-1', username: 'ada', name: 'Ada', roles: ['Catalogador'] }
    fetchMock.mockResolvedValue(response(200, { user }))

    await expect(login('ada', 'secret')).resolves.toEqual({ user })
    expect(fetchMock).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ username: 'ada', password: 'secret' }),
    }))
  })

  it('reports a rejected login without exposing server details', async () => {
    fetchMock.mockResolvedValue(response(401, { error: 'internal LDAP details' }))

    await expect(login('ada', 'wrong')).rejects.toMatchObject({
      status: 401,
      message: 'Authentication rejected',
    })
  })

  it('reports an unavailable authentication service safely', async () => {
    fetchMock.mockResolvedValue(response(503, { error: 'directory host details' }))

    await expect(login('ada', 'secret')).rejects.toEqual(
      new AuthApiError(503, 'Authentication service unavailable'),
    )
  })

  it('rejects a user payload without roles instead of assigning an implicit role', () => {
    expect(toAppUser({ personaId: 'p-1', username: 'ada', name: 'Ada', roles: [] })).toBeNull()
    expect(toAppUser({ personaId: 'p-1', username: 'ada', name: 'Ada' } as never)).toBeNull()
  })

  it('restores the session and logs out through the backend', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, { user: { personaId: 'p-1', username: 'ada', name: 'Ada', roles: ['Catalogador'] } }))
      .mockResolvedValueOnce(response(200, { ok: true }))

    await expect(getMe()).resolves.toMatchObject({ user: { username: 'ada' } })
    await expect(logout()).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/auth/logout', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }))
  })
})
