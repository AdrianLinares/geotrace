import type { ApplicationRole, ManagedPerson, PersonUpdateInput } from '../../server/types'
import { AuthApiError, getMe, toAppUser } from './authApi'
import { useAppStore } from '../stores/appStore'

export class AdminApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'AdminApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (response.ok) return await response.json() as T
  const message = response.status === 401
    ? 'Authentication required'
    : response.status === 403
      ? 'Administrator access required'
      : response.status === 409
        ? 'The change conflicts with a required account rule'
        : response.status === 404
          ? 'Person or role not found'
          : 'User management request failed'
  throw new AdminApiError(response.status, message)
}

export const listManagedPeople = () => request<{ data: ManagedPerson[] }>('/api/admin/personas')
export const listApplicationRoles = () => request<{ data: ApplicationRole[] }>('/api/admin/roles')
export const updateManagedPerson = (personaId: string, input: PersonUpdateInput) => request<ManagedPerson>(`/api/admin/personas/${personaId}`, {
  method: 'PUT',
  body: JSON.stringify(input),
})

type Redirect = (path: string, options?: { replace?: boolean }) => void

/** Reconcile the client session after an administrative mutation. */
export async function reconcileSessionAfterAdminMutation(redirect: Redirect): Promise<void> {
  try {
    const { user } = await getMe()
    useAppStore.getState().setUser(toAppUser(user))
  } catch (error) {
    if (!(error instanceof AuthApiError) || error.status !== 401) throw error

    const { setUser, setActiveColeccion } = useAppStore.getState()
    setUser(null)
    setActiveColeccion(null)
    redirect('/login', { replace: true })
  }
}
