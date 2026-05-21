// Minimal TypeScript types matching the Supabase schema (subset used by the UI)

export type Coleccion = {
  coleccion_id: string
  nombre_coleccion: string
  institucion?: string | null
  responsable?: string | null
  descripcion?: string | null
  estado_coleccion: 'Activa' | 'Cerrada'
  created_at?: string | null
  updated_at?: string | null
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
  ubicacion_id: string
  mueble_cod?: string | null
  seccion?: string | null
  zona?: string | null
  no_bandeja: number
  columna?: string | null
  posicion_placa: number
  tipo_mueble?: string | null
  color_mueble?: string | null
  material_bandeja?: string | null
  ocupada?: boolean | null
  created_at?: string | null
}

export type Placa = {
  placa_id: string
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
  well_name: string
  uwi?: string | null
  well_alias?: string | null
  cuenca_id?: string | null
  pais?: string | null
  departamento?: string | null
  municipio?: string | null
  campo_id?: string | null
  contrato_id?: string | null
  longitud?: number | null
  latitud?: number | null
  coord_x?: number | null
  coord_y?: number | null
  coord_x_origen?: number | null
  coord_y_origen?: number | null
  coord_x_fondo?: number | null
  coord_y_fondo?: number | null
  datum?: string | null
  calidad_coordenada?: string | null
  tvd?: number | null
  kb_elevacion?: number | null
  rotary_elevacion?: number | null
  profundidad_perforacion?: number | null
  elevacion_terreno?: number | null
  clasificacion?: string | null
  estado_pozo?: string | null
  tipo_pozo?: string | null
  clas_final?: string | null
  fecha_spud?: string | null
  fecha_completamiento?: string | null
  tipo_documento?: string | null
  documento_referencia?: string | null
  carga_sgc?: boolean | null
  visible?: boolean | null
  entitlement?: string | null
  nota_sgc?: string | null
  comentario?: string | null
  formacion?: string | null
  formacion_alt?: string | null
  estructura?: string | null
  created_at?: string | null
  updated_at?: string | null
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
