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

export type PlateDto = {
  placa_id: string
  codigo_ubicacion: string | null
  coleccion_id: string | null
  codigo_placa: string | null
  clase_placa_id: string | null
  clase_placa: string | null
  diseno_placa_id: string | null
  diseno_placa: string | null
  configuracion_cavidades_id: string | null
  material_placa_id: string | null
  color_placa_id: string | null
  configuracion_rejilla_id: string | null
  tipo_proteccion_id: string | null
  sistema_ensamble_id: string | null
  catalogador_id: string | null
  fecha_ingreso: string | null
  estado_catalogacion_id: string | null
  estado_catalogacion: string | null
  revisor_id: string | null
  fecha_revision: string | null
  estado_revision_id: string | null
  comentarios: string | null
  observaciones: string | null
}

export type SampleDto = {
  muestra_id: string
  nombre_muestra_original: string | null
  codigo_muestra_sistema: string | null
  origen_muestra_id: string | null
  metodo_adquisicion_id: string | null
  catalogador_id: string | null
  fecha_ingreso: string | null
  revisor_id: string | null
  fecha_revision: string | null
  estado_catalogacion_id: string | null
  estado_catalogacion: string | null
  observaciones: string | null
  tipo_muestra_subsuelo_id: string | null
  pozo_id: string | null
  tipo_intervalo_muestra_id: string | null
  profundidad_tope: number | null
  profundidad_base: number | null
  unidad_medida_id: string | null
}

export type ReadRepository = {
  listCollections(page: number, pageSize: number, search?: string): Promise<Paginated<CollectionDto>>
  getCollection(id: string): Promise<CollectionDto | null>
  listWells(page: number, pageSize: number, search?: string): Promise<Paginated<WellDto>>
  getWell(id: string): Promise<WellDto | null>
  listBasins(): Promise<BasinDto[]>
  listPlates(page: number, pageSize: number, filters: { collectionId?: string; states?: string[]; search?: string }): Promise<Paginated<PlateDto>>
  getPlate(id: string): Promise<PlateDto | null>
  listSamples(page: number, pageSize: number): Promise<Paginated<SampleDto>>
  getSample(id: string): Promise<SampleDto | null>
}

export type CollectionRepository = ReadRepository & {
  createCollection(input: CollectionInput): Promise<CollectionDto>
  updateCollection(id: string, input: CollectionUpdateInput): Promise<CollectionDto | null>
  deleteCollection(id: string): Promise<boolean>
}
