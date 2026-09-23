export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = 'ApiError' }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers } })
  if (!response.ok) throw new ApiError(response.status, (await response.json().catch(() => null))?.error ?? 'API request failed')
  return response.json() as Promise<T>
}
