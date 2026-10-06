export type AuthenticatedUser = {
  personaId: string
  username: string
  name: string
  roles: string[]
}

export type RoleRepository = {
  findActiveUserByUsername(username: string): Promise<AuthenticatedUser | null>
}

export type LocalCredentialRepository = {
  findByUsername(username: string): Promise<{ passwordHash: string } | null>
}

export type ManagedPerson = {
  persona_id: string
  codigo_persona: string
  nombre: string
  apellidos: string
  correo: string
  activo: boolean
  roles: Array<{ rol_id: string; nombre: string }>
}

export type ApplicationRole = { rol_id: string; nombre: string; jerarquia: number }
export type PersonUpdateInput = {
  nombre?: string
  apellidos?: string
  correo?: string
  activo?: boolean
  role_ids?: string[]
}

export type AdminRepository = {
  listPeople(): Promise<ManagedPerson[]>
  listRoles(): Promise<ApplicationRole[]>
  updatePerson(personaId: string, input: PersonUpdateInput): Promise<ManagedPerson | null>
}

export type ImportTable =
  | 'coleccion' | 'pozo' | 'placa' | 'muestra'
  | 'dic_uni_lito_reportada' | 'dic_uni_lito_normalizada' | 'dic_uni_lito_actualizada'
  | 'dic_biozona_reportada' | 'dic_biozona_normalizada' | 'dic_biozona_actualizada'
  | 'dic_edad_reportada' | 'dic_edad_normalizada' | 'dic_edad_actualizada'
export type ImportRow = Record<string, unknown>
export type ImportBatch = { table: ImportTable; rows: ImportRow[] }
export type ImportRepository = {
  importBatches(batches: ImportBatch[]): Promise<number>
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

export type PlateDesignDto = { diseno_placa_id: string; nombre: string | null }
export type PlateClassDto = { clase_placa_id: string; codigo_clase: string | null; nombre: string | null; definicion: string | null }
export type CatalogationStateDto = { estado_catalogacion_id: string; estado: string; significado: string; quien: string | null }
export type ReviewStateDto = { estado_revision_id: string; nombre: string; significado: string }
export type PlateUseStageDto = { etapa_uso_placa_id: string; codigo_etapa_uso_placa: string | null; nombre: string | null; observaciones: string | null }
export type PlateMaterialDto = { material_placa_id: string; nombre: string | null }
export type PlateColorDto = { color_placa_id: string; nombre: string | null }
export type CavityConfigurationDto = { configuracion_cavidades_id: string; diseno_placa_id: string | null; total_cavidades: number | null }
export type GridConfigurationDto = { configuracion_rejilla_id: string; nombre: string | null; numero_subdivisiones: number | null; observaciones: string | null }
export type ProtectionTypeDto = { tipo_proteccion_id: string; nombre: string | null }
export type AssemblySystemDto = { sistema_ensamble_id: string; nombre: string | null }

export type LitoReportadaDto = {
  uni_lito_reportada_id: string; codigo_uni_lito_reportada: string | null; nombre_reportado: string | null;
  catalogador_id: string | null; fecha_ingreso: string | null; revisor_id: string | null;
  fecha_revision: string | null; estado_revision_id: string | null; observaciones: string | null
}
export type LitoNormalizadaDto = {
  uni_lito_normalizada_id: string; cod_uni_lito_normalizada: string | null; nombre_normalizado: string | null;
  rango_lito_id: string | null; referencia_bibliografica_id: string | null; observaciones: string | null;
  revisor_id: string | null; estado_revision_id: string | null; fecha_revision: string | null
}
export type LitoActualizadaDto = {
  uni_lito_actualizada_id: string; cod_uni_lito_actualizada: string | null; nombre_oficial: string | null;
  rango_lito_id: string | null; estado_nomenclatura_id: string | null; revisor_id: string | null;
  fecha_revision: string | null; estado_revision_id: string | null; observaciones: string | null
}
export type BiozonaReportadaDto = {
  biozona_reportada_id: string; nombre_reportado: string | null; autor_biozona_reportada: string | null;
  codigo_biozona: string | null; estado_revision_id: string | null; catalogador_id: string | null;
  fecha_ingreso: string | null; revisor_id: string | null; fecha_revision: string | null; observaciones: string | null
}
export type BiozonaNormalizadaDto = {
  biozona_normalizada_id: string; nombre_normalizado: string | null; codigo_biozona: string | null;
  autor_biozona_normalizada: string | null; estado_revision_id: string | null; revisor_id: string | null;
  fecha_revision: string | null; observaciones: string | null
}
export type BiozonaActualizadaDto = {
  biozona_actualizada_id: string; nombre_actualizado: string | null; codigo_biozona_actual: string | null;
  fuente_actualizacion: string | null; fecha_actualizacion: string | null; revisor_id: string | null;
  fecha_revision: string | null; estado_revision_id: string | null; observaciones: string | null
}
export type EdadReportadaDto = {
  edad_reportada_id: string; nombre_reportado: string | null; estado_revision_id: string | null;
  catalogador_id: string | null; fecha_ingreso: string | null; revisor_id: string | null;
  fecha_revision: string | null; observaciones: string | null
}
export type EdadNormalizadaDto = {
  edad_normalizada_id: string; nombre_normalizado: string | null; rango_cronoestratigrafico_id: string | null;
  estado_revision_id: string | null; revisor_id: string | null; fecha_revision: string | null; observaciones: string | null
}
export type EdadActualizadaDto = {
  edad_actualizada_id: string; nombre_actualizado: string | null; escala_tiempo: string | null;
  fuente_actualizacion: string | null; revisor_id: string | null; fecha_revision: string | null;
  estado_revision_id: string | null; observaciones: string | null
}

export type CatalogFamily<TReportada, TNormalizada, TActualizada> = {
  reportada: TReportada[]
  normalizada: TNormalizada[]
  actualizada: TActualizada[]
}

export type CatalogReferencesDto = {
  cuencas: BasinDto[]
  clasesPlaca: PlateClassDto[]
  disenosPlaca: PlateDesignDto[]
  estadosCatalogacion: CatalogationStateDto[]
  estadosRevision: ReviewStateDto[]
  materialesPlaca: PlateMaterialDto[]
  coloresPlaca: PlateColorDto[]
  configuracionesCavidades: CavityConfigurationDto[]
  configuracionesRejilla: GridConfigurationDto[]
  etapasUsoPlaca: PlateUseStageDto[]
  tiposProteccion: ProtectionTypeDto[]
  sistemasEnsamble: AssemblySystemDto[]
  unidadesLitoestratigraficas: CatalogFamily<LitoReportadaDto, LitoNormalizadaDto, LitoActualizadaDto>
  biozonas: CatalogFamily<BiozonaReportadaDto, BiozonaNormalizadaDto, BiozonaActualizadaDto>
  edades: CatalogFamily<EdadReportadaDto, EdadNormalizadaDto, EdadActualizadaDto>
}

export type CatalogRepository = {
  listReferences(): Promise<CatalogReferencesDto>
}

export type ConservationStateDto = {
  id: string
  name: string | null
}

export type ConservationReferenceDto = {
  vidrio: ConservationStateDto[]
  acetato: ConservationStateDto[]
  marcoPlaca: ConservationStateDto[]
}

export type ConservationRepository = {
  listStates(): Promise<ConservationReferenceDto>
}

export type PlateDto = {
  placa_id: string
  codigo_ubicacion: string | null
  coleccion_id: string | null
  codigo_placa: string | null
  clase_placa_id: string | null
  etapa_uso_placa_id: string | null
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

export type PlateMutationInput = {
  codigo_ubicacion?: string | null
  coleccion_id?: string | null
  codigo_placa?: string | null
  clase_placa_id?: string | null
  etapa_uso_placa_id?: string | null
  diseno_placa_id?: string | null
  configuracion_cavidades_id?: string | null
  material_placa_id?: string | null
  color_placa_id?: string | null
  configuracion_rejilla_id?: string | null
  tipo_proteccion_id?: string | null
  sistema_ensamble_id?: string | null
  catalogador_id?: string | null
  fecha_ingreso?: string | null
  estado_catalogacion_id?: string | null
  revisor_id?: string | null
  fecha_revision?: string | null
  estado_revision_id?: string | null
  comentarios?: string | null
  observaciones?: string | null
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

export type SampleMutationInput = {
  nombre_muestra_original?: string | null
  codigo_muestra_sistema?: string | null
  origen_muestra_id?: string | null
  metodo_adquisicion_id?: string | null
  catalogador_id?: string | null
  fecha_ingreso?: string | null
  revisor_id?: string | null
  fecha_revision?: string | null
  estado_catalogacion_id?: string | null
  observaciones?: string | null
}

export type PhysicalLocationDto = {
  ubicacion_fisica_id: string
  codigo_ubicacion: string | null
  placa_id: string | null
  bandeja_id: string | null
  numero_bandeja: number | null
  zona_mueble_id: string | null
  seccion_mueble_id: string | null
  seccion_codigo: string | null
  seccion_nombre: string | null
  columna_bandeja_id: string | null
  columna_codigo: string | null
  columna_nombre: string | null
  posicion_bandeja: number | null
  material_bandeja_id: string | null
  material_bandeja: string | null
  fecha_ubicacion: string | null
  observaciones: string | null
}

export type DashboardKpisDto = {
  totalPlacas: number
  totalMuestras: number
  placasValidadas: number
  ubicacionesDisponibles: number
}

export type DashboardEstadoDto = { name: string; value: number }
export type DashboardOcupacionDto = { name: string; ocupacion: number; total: number; ocupadas: number }
export type DashboardActividadDto = {
  auditoria_id: string
  tabla: string
  operacion: 'INSERT' | 'UPDATE' | 'DELETE'
  registro_id: string
  created_at: string | null
}
export type DashboardProblemaDto = {
  placa_id: string
  nivel: 'CRÍTICA' | 'ATENCIÓN' | 'LEVE'
  vidrio_estado: string | null
  presencia_hongos: boolean | null
  riesgo_contaminacion: boolean | null
}
export type DashboardDto = {
  kpis: DashboardKpisDto
  estadoCatalogacion: DashboardEstadoDto[]
  ocupacion: DashboardOcupacionDto[]
  actividadReciente: DashboardActividadDto[]
  problemasConservacion: DashboardProblemaDto[]
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
  listPhysicalLocations(page: number, pageSize: number, filters: { search?: string; occupied?: boolean; sectionId?: string }): Promise<Paginated<PhysicalLocationDto>>
  getPhysicalLocation(id: string): Promise<PhysicalLocationDto | null>
  getDashboard(): Promise<DashboardDto>
}

export type CollectionRepository = ReadRepository & {
  createCollection(input: CollectionInput): Promise<CollectionDto>
  updateCollection(id: string, input: CollectionUpdateInput): Promise<CollectionDto | null>
  deleteCollection(id: string): Promise<boolean>
}

export type PlateRepository = CollectionRepository & {
  createPlate(input: PlateMutationInput): Promise<PlateDto>
  updatePlate(id: string, input: PlateMutationInput, user: AuthenticatedUser): Promise<PlateDto | null>
  transitionPlate(id: string, targetStateId: string, user: AuthenticatedUser): Promise<PlateDto | null>
  createSample(input: SampleMutationInput): Promise<SampleDto>
  updateSample(id: string, input: SampleMutationInput, user: AuthenticatedUser): Promise<SampleDto | null>
  deleteSample(id: string): Promise<boolean>
}
