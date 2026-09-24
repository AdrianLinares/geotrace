import { describe, expect, it, vi } from 'vitest'
import { AuthService, InvalidCredentialsError, MissingApplicationRoleError, requireRole } from '../../server/auth'
import type { DirectoryAuthenticator, RoleRepository, SessionRepository, AuthenticatedUser } from '../../server/types'
import { hashPassword } from '../../server/passwords'

const user: AuthenticatedUser = { personaId: '1', username: 'ada@example.test', name: 'Ada Lovelace', roles: ['Catalogador'] }

function setup(role: AuthenticatedUser | null = user) {
  const directory: DirectoryAuthenticator = { authenticate: vi.fn(), close: vi.fn() }
  const roles: RoleRepository = { findActiveUserByUsername: vi.fn().mockResolvedValue(role) }
  const sessions: SessionRepository = { create: vi.fn(), find: vi.fn(), remove: vi.fn() }
  return { service: new AuthService(directory, roles, sessions, 60), directory, roles, sessions }
}

function setupLocal(role: AuthenticatedUser | null = { ...user, roles: ['Administrador'] }) {
  const directory: DirectoryAuthenticator = { authenticate: vi.fn(), close: vi.fn() }
  const roles: RoleRepository = { findActiveUserByUsername: vi.fn().mockResolvedValue(role) }
  const sessions: SessionRepository = { create: vi.fn(), find: vi.fn(), remove: vi.fn() }
  const credentials = { findByUsername: vi.fn() }
  return { service: new AuthService(directory, roles, sessions, 60, { username: user.username, credentials }), directory, roles, sessions, credentials }
}

describe('AuthService', () => {
  it('creates a session after valid AD credentials and an active role', async () => {
    const { service, sessions, roles } = setup()
    const result = await service.login(user.username, 'password')
    expect(result.user).toEqual(user)
    expect(roles.findActiveUserByUsername).toHaveBeenCalledWith(user.username)
    expect(sessions.create).toHaveBeenCalledOnce()
  })

  it('rejects invalid AD credentials', async () => {
    const { service, directory, sessions } = setup()
  vi.mocked(directory.authenticate).mockRejectedValue(new InvalidCredentialsError('Invalid credentials'))
    await expect(service.login(user.username, 'wrong')).rejects.toBeInstanceOf(InvalidCredentialsError)
    expect(sessions.create).not.toHaveBeenCalled()
  })

  it('prefers valid AD credentials over the local fallback', async () => {
    const { service, directory, credentials } = setupLocal()
    await service.login(user.username, 'password')
    expect(directory.authenticate).toHaveBeenCalledOnce()
    expect(credentials.findByUsername).not.toHaveBeenCalled()
  })

  it('falls back to a local credential when AD is unavailable', async () => {
    const { service, directory, credentials, sessions } = setupLocal()
    vi.mocked(directory.authenticate).mockRejectedValue(new Error('AD unavailable'))
    vi.mocked(credentials.findByUsername).mockResolvedValue({ passwordHash: await hashPassword('password') })
    const result = await service.login(user.username, 'password')
    expect(result.user.roles).toEqual(['Administrador'])
    expect(sessions.create).toHaveBeenCalledOnce()
  })

  it('rejects an incorrect local password and a user without an active role', async () => {
    const first = setupLocal()
    vi.mocked(first.directory.authenticate).mockRejectedValue(new Error('AD unavailable'))
    vi.mocked(first.credentials.findByUsername).mockResolvedValue({ passwordHash: await hashPassword('password') })
    await expect(first.service.login(user.username, 'wrong')).rejects.toBeInstanceOf(InvalidCredentialsError)

    const second = setupLocal(null)
    vi.mocked(second.directory.authenticate).mockRejectedValue(new Error('AD unavailable'))
    vi.mocked(second.credentials.findByUsername).mockResolvedValue({ passwordHash: await hashPassword('password') })
    await expect(second.service.login(user.username, 'password')).rejects.toBeInstanceOf(MissingApplicationRoleError)
  })

  it('rejects an AD user without an application role', async () => {
    const { service, sessions } = setup(null)
    await expect(service.login(user.username, 'password')).rejects.toBeInstanceOf(MissingApplicationRoleError)
    expect(sessions.create).not.toHaveBeenCalled()
  })

  it('rejects an inactive role assignment represented by no active roles', async () => {
    const { service } = setup({ ...user, roles: [] })
    await expect(service.login(user.username, 'password')).rejects.toBeInstanceOf(MissingApplicationRoleError)
  })

  it('restores and logs out a session using its token hash', async () => {
    const { service, sessions } = setup()
    const { token } = await service.login(user.username, 'password')
    vi.mocked(sessions.find).mockResolvedValue(user)
    expect(await service.restore(token)).toEqual(user)
    await service.logout(token)
    expect(sessions.find).toHaveBeenCalledOnce()
    expect(sessions.remove).toHaveBeenCalledOnce()
  })

  it('revalidates the current application role when restoring a session', async () => {
    const { service, sessions, roles } = setup()
    vi.mocked(sessions.find).mockResolvedValue(user)
    vi.mocked(roles.findActiveUserByUsername).mockResolvedValue(null)

    await expect(service.restore('session-token')).resolves.toBeNull()
    expect(sessions.remove).toHaveBeenCalledOnce()
  })

  it('returns a safe infrastructure error when the directory is unavailable', async () => {
    const { service, directory } = setup()
    vi.mocked(directory.authenticate).mockRejectedValue(new Error('timeout'))

    await expect(service.login(user.username, 'password')).rejects.toMatchObject({
      message: 'Directory authentication unavailable',
    })
  })

  it('provides reusable role authorization', () => {
    expect(requireRole('ADMINISTRADOR')({ ...user, roles: ['Administrador'] })).toBe(true)
    expect(requireRole('Administrador')({ ...user, roles: ['Catalogador'] })).toBe(false)
  })
})
