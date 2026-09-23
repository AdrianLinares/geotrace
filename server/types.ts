export type AuthenticatedUser = {
  personaId: string
  username: string
  name: string
  roles: string[]
}

export type RoleRepository = {
  findActiveUserByUsername(username: string): Promise<AuthenticatedUser | null>
}

export type SessionRepository = {
  create(tokenHash: string, user: AuthenticatedUser, expiresAt: Date): Promise<void>
  find(tokenHash: string): Promise<AuthenticatedUser | null>
  remove(tokenHash: string): Promise<void>
}

export type DirectoryAuthenticator = {
  authenticate(username: string, password: string): Promise<void>
  close(): Promise<void>
}
