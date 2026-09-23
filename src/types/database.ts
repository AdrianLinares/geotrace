// Minimal TypeScript types matching the Supabase schema (subset used by the UI)

export type Coleccion = {
  coleccion_id: string
  codigo_coleccion: string | null
  nombre_coleccion: string | null
  institucion: string | null
  responsable_coleccion: string | null
  descripcion: string | null
  estado_coleccion: string | null
}

export type Persona = {
  persona_id: string
  nombre: string
  rol: 'Catalogador' | 'Revisor' | 'Curador' | 'Administrador' | string
  email?: string | null
  activo?: boolean | null
  created_at?: string | null
}

export type Mueble = {
  mueble_cod: string
  material_mueble?: string | null
  color?: string | null
  tiene_seccion?: boolean | null
  secciones_permitidas?: string | null
  tiene_zona?: boolean | null
  zonas_permitidas?: string | null
  max_bandejas?: number | null
  material_bandeja?: string | null
  capacidad_min?: number | null
  capacidad_max?: number | null
  ubicacion_fisica?: string | null
  observaciones?: string | null
  created_at?: string | null
}

export type UbicacionFisica = {
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

/** Legacy import shape; physical-location reads must use the normalized DTO above. */
export type LegacyUbicacionFisica = Record<string, unknown>

export type Placa = {
  placa_id: string
  codigo_ubicacion?: string | null
  codigo_placa?: string | null
  clase_placa_id?: string | null
  diseno_placa_id?: string | null
  configuracion_cavidades_id?: string | null
  estado_catalogacion_id?: string | null
  ubicacion_id?: string | null
  coleccion_id?: string | null
  clase_placa?: string | null
  rol_placa?: string | null
  diseno_placa?: string | null
  total_cavidades?: number | null
  estado_placa?: string | null
  tipo_rejilla?: string | null
  cubierta?: string | null
  tipo_abrazadera?: string | null
  catalogador_id?: string | null
  estado_catalogacion?: 'En proceso' | 'Incompleto' | 'En revisión' | 'Validado' | 'Cerrado'
  created_at?: string | null
  updated_at?: string | null
}

export type Muestra = {
  muestra_id: string
  nombre_muestra_original?: string | null
  codigo_muestra_sistema?: string | null
  origen_muestra_id?: string | null
  metodo_adquisicion_id?: string | null
  estado_catalogacion_id?: string | null
  tipo_muestra_subsuelo_id?: string | null
  tipo_intervalo_muestra_id?: string | null
  unidad_medida_id?: string | null
  observaciones?: string | null
  placa_id?: string | null
  procedencia_muestra?: 'Superficie' | 'Pozo' | null
  nombre_pozo?: string | null
  pozo_id?: string | null
  tipo_muestra?: string | null
  tipo_profundidad?: 'Intervalo' | 'Puntual' | null
  profundidad_puntual?: string | number | null
  profundidad_tope?: string | number | null
  profundidad_base?: string | number | null
  unidad_medida?: string | null
  cod_muestra?: string | null
  igm?: string | null
  no_preparacion?: string | null
  info_inferida?: boolean | null
  estado_catalogacion?: 'En proceso' | 'Incompleto' | 'En revisión' | 'Validado' | 'Cerrado'
  fecha_estado?: string | null
  catalogador_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type AuditoriaCambio = {
  auditoria_id: number
  tabla?: string | null
  registro_id?: string | null
  operacion?: string | null
  campo_modificado?: string | null
  valor_anterior?: string | null
  valor_nuevo?: string | null
  usuario_id?: string | null
  created_at?: string | null
}

export type Pozo = {
  pozo_id: string
  codigo_pozo?: string | null
  nombre_pozo?: string | null
  cuenca_id?: string | null
  localizacion_geografica_id?: string | null
  localizacion_espacial_id?: string | null
  estado_catalogacion_id?: string | null
  estado_revision_id?: string | null
  observaciones?: string | null
}

export type PozoEmpresa = {
  pozo_empresa_id: string
  pozo_id: string
  empresa_id: string
  rol?: string | null
  created_at?: string | null
}

export type DicCuenca = {
  cuenca_id: string
  nombre_cuenca: string
  created_at?: string | null
}

export type DicCampo = {
  campo_id: string
  nombre_campo: string
  created_at?: string | null
}

export type DicContrato = {
  contrato_id: string
  nombre_contrato: string
  created_at?: string | null
}

export type Empresa = {
  empresa_id: string
  nombre_empresa: string
  tipo_empresa?: string | null
  pais?: string | null
  observaciones?: string | null
  created_at?: string | null
}

// Generic response for paginated queries
export type PaginatedResult<T> = {
  data: T[]
  total: number | null
}

export type Database = {
  coleccion: Coleccion
  persona: Persona
  mueble: Mueble
  ubicacion_fisica: UbicacionFisica
  placa: Placa
  muestra: Muestra
  auditoria_cambios: AuditoriaCambio
  pozo: Pozo
  pozo_empresa: PozoEmpresa
  dic_cuenca: DicCuenca
  dic_campo: DicCampo
  dic_contrato: DicContrato
  empresa: Empresa
}

export default Database
