import type { DirectoryAuthenticator, LocalCredentialRepository, RoleRepository, SessionRepository, AuthenticatedUser } from './types'
import { createSessionToken, hashSessionToken } from './security'
import { verifyPassword } from './passwords'

export class InvalidCredentialsError extends Error {}
export class MissingApplicationRoleError extends Error {}
export class AuthenticationInfrastructureError extends Error {}

export class AuthService {
  constructor(private readonly directory: DirectoryAuthenticator, private readonly roles: RoleRepository, private readonly sessions: SessionRepository, private readonly ttlSeconds: number, private readonly local?: { username: string; credentials: LocalCredentialRepository }) {}

  async login(username: string, password: string): Promise<{ token: string; user: AuthenticatedUser }> {
    let authenticatedByDirectory = true
    try {
      await this.directory.authenticate(username, password)
    } catch (error) {
      authenticatedByDirectory = false
      if (!this.local || username.toLowerCase() !== this.local.username.toLowerCase()) {
        if (error instanceof InvalidCredentialsError) throw error
        throw new AuthenticationInfrastructureError('Directory authentication unavailable')
      }
      let credential: { passwordHash: string } | null
      try {
        credential = await this.local.credentials.findByUsername(username)
      } catch {
        throw new AuthenticationInfrastructureError('Local authentication unavailable')
      }
      if (!credential || !(await verifyPassword(password, credential.passwordHash))) throw new InvalidCredentialsError('Invalid credentials')
    }
    let user: AuthenticatedUser | null
    try {
      user = await this.roles.findActiveUserByUsername(username)
    } catch {
      throw new AuthenticationInfrastructureError('Application role lookup unavailable')
    }
    if (!user || user.roles.length === 0) throw new MissingApplicationRoleError('No active application role')
    const token = createSessionToken()
    await this.sessions.create(hashSessionToken(token), user, new Date(Date.now() + this.ttlSeconds * 1000))
    return { token, user, ...(authenticatedByDirectory ? {} : { local: true }) }
  }

  async restore(token: string | undefined): Promise<AuthenticatedUser | null> {
    if (!token) return null
    let sessionUser: AuthenticatedUser | null
    try {
      sessionUser = await this.sessions.find(hashSessionToken(token))
    } catch {
      throw new AuthenticationInfrastructureError('Session lookup unavailable')
    }
    if (!sessionUser) return null

    let activeUser: AuthenticatedUser | null
    try {
      activeUser = await this.roles.findActiveUserByUsername(sessionUser.username)
    } catch {
      throw new AuthenticationInfrastructureError('Application role lookup unavailable')
    }
    if (!activeUser || activeUser.personaId !== sessionUser.personaId || activeUser.roles.length === 0) {
      try {
        await this.sessions.remove(hashSessionToken(token))
      } catch {
        throw new AuthenticationInfrastructureError('Session invalidation unavailable')
      }
      return null
    }
    return activeUser
  }

  logout(token: string | undefined): Promise<void> {
    return token ? this.sessions.remove(hashSessionToken(token)) : Promise.resolve()
  }
}

export function requireRole(role: string) {
  return (user: AuthenticatedUser | null | undefined): boolean =>
    !!user && user.roles.some((candidate) => candidate.trim().toLowerCase() === role.trim().toLowerCase())
}
