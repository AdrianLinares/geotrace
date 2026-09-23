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

export type Paginated<T> = { data: T[]; total: number }

export type CollectionDto = {
  coleccion_id: string
  codigo_coleccion: string | null
  nombre_coleccion: string | null
  institucion: string | null
  responsable_coleccion: string | null
  descripcion: string | null
  estado_coleccion: string | null
}

export type CollectionInput = Omit<CollectionDto, 'coleccion_id'>
export type CollectionUpdateInput = Partial<CollectionInput>

export type WellDto = {
  pozo_id: string
  codigo_pozo: string | null
  nombre_pozo: string | null
  cuenca_id: string | null
  localizacion_geografica_id: string | null
  localizacion_espacial_id: string | null
  estado_catalogacion_id: string | null
  estado_revision_id: string | null
  observaciones: string | null
}

export type BasinDto = { cuenca_id: string; nombre_cuenca: string | null }

export type ReadRepository = {
  listCollections(page: number, pageSize: number, search?: string): Promise<Paginated<CollectionDto>>
  getCollection(id: string): Promise<CollectionDto | null>
  listWells(page: number, pageSize: number, search?: string): Promise<Paginated<WellDto>>
  getWell(id: string): Promise<WellDto | null>
  listBasins(): Promise<BasinDto[]>
}

export type CollectionRepository = ReadRepository & {
  createCollection(input: CollectionInput): Promise<CollectionDto>
  updateCollection(id: string, input: CollectionUpdateInput): Promise<CollectionDto | null>
  deleteCollection(id: string): Promise<boolean>
}
