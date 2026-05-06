import { vi } from 'vitest'

type GetSessionResult = {
  data: { session: { user?: { email?: string | null } } | null }
  error: unknown | null
}

type PersonaResult = {
  data: Array<{ persona_id?: string; nombre?: string; rol?: string }> | null
  error: unknown | null
}

const getSessionMock = vi.fn<[], Promise<GetSessionResult>>(() =>
  Promise.resolve({ data: { session: null }, error: null })
)

const onAuthStateChangeMock = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}))

const queryBuilder = {
  select: vi.fn(() => queryBuilder),
  ilike: vi.fn(() => queryBuilder),
  limit: vi.fn<[], Promise<PersonaResult>>(() =>
    Promise.resolve({ data: [], error: null })
  ),
}

const fromMock = vi.fn(() => queryBuilder)

export const supabaseMock = {
  auth: {
    getSession: getSessionMock,
    onAuthStateChange: onAuthStateChangeMock,
  },
  from: fromMock,
}

export const mockSession = (session: GetSessionResult['data']['session']) => {
  getSessionMock.mockResolvedValue({ data: { session }, error: null })
}

export const mockGetSessionError = (error: unknown) => {
  getSessionMock.mockResolvedValue({ data: { session: null }, error })
}

export const mockPersonaResponse = (data: PersonaResult['data'], error: unknown = null) => {
  queryBuilder.limit.mockResolvedValue({ data, error })
}

export const resetSupabaseMocks = () => {
  getSessionMock.mockClear()
  onAuthStateChangeMock.mockClear()
  fromMock.mockClear()
  queryBuilder.select.mockClear()
  queryBuilder.ilike.mockClear()
  queryBuilder.limit.mockClear()

  getSessionMock.mockResolvedValue({ data: { session: null }, error: null })
  queryBuilder.limit.mockResolvedValue({ data: [], error: null })
}
