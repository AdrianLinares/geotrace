export type AuthenticatedUser = {
  personaId: string
  username: string
  name: string
  roles: string[]
}

export type AppUser = {
  persona_id: string
  nombre: string
  rol: string
}

export function toAppUser(user: AuthenticatedUser | null | undefined): AppUser | null {
  if (!user || !Array.isArray(user.roles) || user.roles.length === 0) return null

  return {
    persona_id: user.personaId,
    nombre: user.name,
    rol: user.roles[0],
  }
}

type UserResponse = { user: AuthenticatedUser }

export class AuthApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AuthApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(path, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })

    if (!response.ok) {
      const message = response.status === 401
        ? 'Authentication rejected'
        : response.status === 503
          ? 'Authentication service unavailable'
          : 'Authentication request failed'
      throw new AuthApiError(response.status, message)
    }

    return await response.json() as T
  } catch (error) {
    if (error instanceof AuthApiError) throw error
    throw new AuthApiError(0, 'Authentication service unavailable')
  }
}

export function login(username: string, password: string) {
  return request<UserResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function getMe() {
  return request<UserResponse>('/auth/me')
}

export function logout() {
  return request<{ ok: true }>('/auth/logout', { method: 'POST' })
}
