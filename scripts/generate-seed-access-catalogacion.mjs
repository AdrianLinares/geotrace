import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const sourceDir = resolve(repoRoot, 'sql/modulo_catalogacion_placas_pozos')
const outputFile = resolve(repoRoot, 'sql/seed/modulo_access_catalogacion.sql')

// Access names catalogers by PersonaID. The target database already owns
// persona_id = 1 for the bootstrap superadmin, so Access personas are seeded on a
// disjoint range and every catalogador_id / revisor_id is translated with this offset.
const PERSONA_ID_OFFSET = 100

const report = {
  notes: [],
  unresolved: [],
  skipped: [],
}

function loadSheet(file, sheet) {
  const workbook = XLSX.read(readFileSync(resolve(sourceDir, file)), { type: 'buffer', cellDates: true })
  const worksheet = workbook.Sheets[sheet]
  if (!worksheet) throw new Error(`Sheet "${sheet}" not found in ${file}`)
  return XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: null })
}

function isEmpty(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

function cleanText(value) {
  if (isEmpty(value)) return null
  return String(value)
    .replace(/\r\n|\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line, index, lines) => line.length > 0 && line !== lines[index - 1])
    .join('\n')
}

function toText(value, max = 255) {
  const text = cleanText(value)
  if (text === null) return null
  if (text.length > max) throw new Error(`Text exceeds ${max} characters: ${text.slice(0, 60)}...`)
  return text
}

function toTimestamp(value) {
  if (isEmpty(value)) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${String(value)}`)
  return date.toISOString()
}

function toInteger(value) {
  if (isEmpty(value)) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) throw new Error(`Expected integer, got: ${String(value)}`)
  return parsed
}

// The Access module computes ProfTopeConvertida / ProfBaseConvertida with decimals so that feet plus
// inches survive (10449'11" -> 10449.916663 ft). The target schema stores numeric, so the converted
// decimal value is preserved exactly without rounding.
function toDepth(value) {
  if (isEmpty(value)) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`Expected numeric depth, got: ${String(value)}`)
  return parsed
}

function toBoolean(value, fallback = null) {
  if (isEmpty(value)) return fallback
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', '-1', 'yes'].includes(normalized)) return true
  if (['false', '0', 'no'].includes(normalized)) return false
  throw new Error(`Expected boolean, got: ${String(value)}`)
}

// Marker for raw SQL expressions. Plain strings are always quoted as literals, so timestamps must
// be emitted through this wrapper instead of being quoted into the useless literal 'now()'.
class RawSql {
  constructor(text) {
    this.text = text
  }
}

function sql(expression) {
  return new RawSql(expression)
}

function quote(value) {
  if (value === null || value === undefined) return 'NULL'
  if (value instanceof RawSql) return value.text
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number') return String(value)
  return `'${String(value).replace(/'/g, "''")}'`
}

function normalizeName(value) {
  if (isEmpty(value)) return ''
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

// Authoritative cabinet-zone catalogue. Access CAT_ZONA.xlsx only contains the first four rows,
// but the local vocabulary also uses "Central izquierda" and "Central derecha", so the seed
// materialises the full six-row catalogue explicitly and ignores the workbook for this table.
const CABINET_ZONES = [
  { zona_id: 1, codigo_zona: 'Izq', nombre: 'Izquierda' },
  { zona_id: 2, codigo_zona: 'Cent', nombre: 'Central' },
  { zona_id: 3, codigo_zona: 'Der', nombre: 'Derecha' },
  { zona_id: 4, codigo_zona: 'Uni', nombre: 'Única' },
  { zona_id: 5, codigo_zona: 'CentIzq', nombre: 'Central Izquierda' },
  { zona_id: 6, codigo_zona: 'CentDer', nombre: 'Central Derecha' },
]

function normalizeZoneName(value) {
  if (isEmpty(value)) return ''
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const ZONE_NAME_TO_ID = new Map(
  CABINET_ZONES.map((zone) => [normalizeZoneName(zone.nombre), zone.zona_id]),
)

function resolveZonaId(nombreZona) {
  const key = normalizeZoneName(nombreZona)
  return ZONE_NAME_TO_ID.get(key) ?? null
}

const NOW = sql('CURRENT_TIMESTAMP')
const counts = []
const statements = []

function insert(table, pk, columns, rows) {
  if (!rows.length) return
  // Postgres rejects a single statement that would touch the same row twice, and a duplicated key
  // usually means two source workbooks were merged with colliding identifiers. Fail here with the
  // offending values instead of letting the transaction die with an opaque constraint name.
  const seen = new Map()
  for (const row of rows) {
    const value = row[pk]
    if (seen.has(value)) {
      throw new Error(
        `Duplicate ${table}.${pk} = ${JSON.stringify(value)} in generated rows: ` +
          `${JSON.stringify(seen.get(value))} and ${JSON.stringify(row)}`,
      )
    }
    seen.set(value, row)
  }
  counts.push([table, rows.length])
  const updates = columns.filter((column) => column !== pk).map((column) => `${column} = EXCLUDED.${column}`)
  const tuples = rows.map((row) => `  (${columns.map((column) => quote(row[column])).join(', ')})`)
  const onConflict = ` ON CONFLICT (${pk}) DO UPDATE SET ${updates.join(', ')}`
  for (let index = 0; index < tuples.length; index += 200) {
    statements.push(
      `INSERT INTO public.${table} (${columns.join(', ')}) OVERRIDING SYSTEM VALUE\nVALUES\n${tuples
        .slice(index, index + 200)
        .join(',\n')}${onConflict};`,
    )
  }
}

// Access uses 0 as a "no value" placeholder in every optional foreign key of the module, not just
// EstadoRevisionID: 0 also appears in EstadoMaterialID, RecobroCualitativoID, PrioridadIntervencionID
// and the second depth unit columns. None of the target catalogues contain a row with id 0, so 0 is
// normalised to NULL exactly like an empty cell.
function optionalId(value) {
  if (isEmpty(value)) return null
  const id = toInteger(value)
  return id === 0 ? null : id
}

function note(message) {
  report.notes.push(message)
}

function unresolved(message) {
  report.unresolved.push(message)
}

function skipped(message) {
  report.skipped.push(message)
}

// ---------------------------------------------------------------- reference catalogues

insert(
  'cat_origen_muestra',
  'origen_muestra_id',
  ['origen_muestra_id', 'nombre', 'significado', 'created_at', 'updated_at'],
  loadSheet('CAT_ORIGEN_MUESTRA.xlsx', 'CAT_ORIGEN_MUESTRA').map((row) => ({
    origen_muestra_id: toInteger(row.OrigenMuestraID),
    nombre: toText(row.Nombre),
    significado: toText(row.Significado),
    created_at: NOW,
    updated_at: NOW,
  })),
)

insert(
  'cat_seccion',
  'seccion_id',
  ['seccion_id', 'codigo_seccion', 'nombre', 'created_at', 'updated_at'],
  loadSheet('CAT_SECCION.xlsx', 'CAT_SECCION').map((row) => ({
    seccion_id: toInteger(row.SeccionID),
    codigo_seccion: toText(row.CodigoSeccion),
    nombre: toText(row.Nombre),
    created_at: NOW,
    updated_at: NOW,
  })),
)

insert(
  'cat_zona',
  'zona_id',
  ['zona_id', 'codigo_zona', 'nombre', 'created_at', 'updated_at'],
  CABINET_ZONES.map((zone) => ({
    zona_id: zone.zona_id,
    codigo_zona: zone.codigo_zona,
    nombre: zone.nombre,
    created_at: NOW,
    updated_at: NOW,
  })),
)
note(
  'cat_zona: seeded from the authoritative six-zone constant (Izquierda, Central, Derecha, ' +
    'Única, Central Izquierda, Central Derecha). The Access CAT_ZONA.xlsx only contains the first four rows.',
)

const ANNOTATION_POSITIONS = [
  { column: 'AnotacionIzquierda', id: 1, nombre: 'Izquierda' },
  { column: 'AnotacionDerecha', id: 2, nombre: 'Derecha' },
  { column: 'AnotacionArriba', id: 3, nombre: 'Arriba' },
  { column: 'AnotacionAbajo', id: 4, nombre: 'Abajo' },
]

insert(
  'cat_posicion_anotacion',
  'posicion_anotacion_id',
  ['posicion_anotacion_id', 'nombre', 'created_at', 'updated_at'],
  ANNOTATION_POSITIONS.map((position) => ({
    posicion_anotacion_id: position.id,
    nombre: position.nombre,
    created_at: NOW,
    updated_at: NOW,
  })),
)
note(
  'cat_posicion_anotacion: 4 rows derived from the ANOTACION_PLACA position column headers. The module has no ' +
    'dedicated catalogue for these positions.',
)

insert(
  'cat_diseno_placa',
  'diseno_placa_id',
  ['diseno_placa_id', 'nombre', 'created_at', 'updated_at'],
  loadSheet('CAT_DISENO_PLACA.xlsx', 'CAT_DISENO_PLACA').map((row) => ({
    diseno_placa_id: toInteger(row.DisenoPlacaID),
    nombre: toText(row.Nombre),
    created_at: NOW,
    updated_at: NOW,
  })),
)

// CAT_CONFIGURACION_CAVIDADES holds only the cavity count while CAT_DISENO_CONFIG_CAVIDADES
// holds the design x count pairs. The target schema models the pair in one table.
const cavityTotals = new Map(
  loadSheet('CAT_CONFIGURACION_CAVIDADES.xlsx', 'CAT_CONFIGURACION_CAVIDADES').map((row) => [
    toInteger(row.ConfiguracionCavidadesID),
    toInteger(row.TotalCavidades),
  ]),
)
const cavityRows = []
const cavityIdMap = new Map()
let nextCavityId = 1
for (const row of loadSheet('CAT_DISENO_CONFIG_CAVIDADES.xlsx', 'CAT_DISENO_CONFIG_CAVIDADES')) {
  const accessId = toInteger(row.ConfiguracionCavidadesID)
  const total = cavityTotals.get(accessId)
  if (total === undefined) throw new Error(`CAT_DISENO_CONFIG_CAVIDADES references unknown ConfiguracionCavidadesID ${accessId}`)
  cavityRows.push({
    configuracion_cavidades_id: nextCavityId,
    diseno_placa_id: toInteger(row.DisenoPlacaID),
    total_cavidades: total,
    created_at: NOW,
    updated_at: NOW,
  })
  cavityIdMap.set(accessId, nextCavityId)
  nextCavityId += 1
}
insert(
  'cat_configuracion_cavidades',
  'configuracion_cavidades_id',
  ['configuracion_cavidades_id', 'diseno_placa_id', 'total_cavidades', 'created_at', 'updated_at'],
  cavityRows,
)
note(
  'cat_configuracion_cavidades: CAT_CONFIGURACION_CAVIDADES and CAT_DISENO_CONFIG_CAVIDADES were merged because the ' +
    'target schema stores design and cavity count in one table. Access ConfiguracionCavidadesID is translated through that pair.',
)

const simpleCatalogues = [
  ['CAT_CLASE_PLACA.xlsx', 'CAT_CLASE_PLACA', 'cat_clase_placa', 'ClasePlacaID', 'clase_placa_id',
    [['CodigoClase', 'codigo_clase', 'text'], ['Nombre', 'nombre', 'text'], ['Definicion', 'definicion', 'text']]],
  ['CAT_MATERIAL_PLACA.xlsx', 'CAT_MATERIAL_PLACA', 'cat_material_placa', 'MaterialPlacaID', 'material_placa_id',
    [['Nombre', 'nombre', 'text']]],
  ['CAT_COLOR_PLACA.xlsx', 'CAT_COLOR_PLACA', 'cat_color_placa', 'ColorPlacaID', 'color_placa_id',
    [['Nombre', 'nombre', 'text']]],
  ['CAT_MATERIAL_MUEBLE.xlsx', 'CAT_MATERIAL_MUEBLE', 'cat_material_mueble', 'MaterialMuebleID', 'material_mueble_id',
    [['Nombre', 'nombre', 'text'], ['Descripcion', 'descripcion', 'text']]],
  ['CAT_COLOR_MUEBLE.xlsx', 'CAT_COLOR_MUEBLE', 'cat_color_mueble', 'ColorMuebleID', 'color_mueble_id',
    [['Nombre', 'nombre', 'text']]],
  ['CAT_MATERIAL_BANDEJA.xlsx', 'CAT_MATERIAL_BANDEJA', 'cat_material_bandeja', 'MaterialBandejaID', 'material_bandeja_id',
    [['CodigoMaterialBandeja', 'codigo_material_bandeja', 'text'], ['Nombre', 'nombre', 'text']]],
  ['CAT_COLUMNA_BANDEJA.xlsx', 'CAT_COLUMNA_BANDEJA', 'cat_columna_bandeja', 'ColumnaBandejaID', 'columna_bandeja_id',
    [['CodigoColumna', 'codigo_columna', 'text'], ['Nombre', 'nombre', 'text']]],
  ['CAT_CONFIGURACION_REJILLA.xlsx', 'CAT_CONFIGURACION_REJILLA', 'cat_configuracion_rejilla', 'ConfiguracionRejillaID', 'configuracion_rejilla_id',
    [['Nombre', 'nombre', 'text'], ['NumeroSubdivisiones', 'numero_subdivisiones', 'integer'], ['Observaciones', 'observaciones', 'text']]],
  ['CAT_TIPO_PROTECCION.xlsx', 'CAT_TIPO_PROTECCION', 'cat_tipo_proteccion', 'TipoProteccionID', 'tipo_proteccion_id',
    [['Nombre', 'nombre', 'text']]],
  ['CAT_SISTEMA_ENSAMBLE.xlsx', 'CAT_SISTEMA_ENSAMBLE', 'cat_sistema_ensamble', 'SistemaEnsambleID', 'sistema_ensamble_id',
    [['Nombre', 'nombre', 'text']]],
  ['CAT_ETAPA_USO_PLACA.xlsx', 'CAT_ETAPA_USO_PLACA', 'cat_etapa_uso_placa', 'EtapaUsoPlacaID', 'etapa_uso_placa_id',
    [['CodigoEtapaUsoPlaca', 'codigo_etapa_uso_placa', 'text'], ['Nombre', 'nombre', 'text'], ['Observaciones', 'observaciones', 'text']]],
  ['CAT_ESTADO_MATERIAL.xlsx', 'CAT_ESTADO_MATERIAL', 'cat_estado_material', 'EstadoMaterialID', 'estado_material_id',
    [['EstadoMaterial', 'estado_material', 'text']]],
  ['CAT_RECOBRO_CUALITATIVO.xlsx', 'CAT_RECOBRO_CUALITATIVO', 'cat_recobro_cualitativo', 'RecobroCualitativoID', 'recobro_cualitativo_id',
    [['RecobroCualitativo', 'recobro_cualitativo', 'text'], ['OrdenVisual', 'orden_visual', 'integer']]],
  ['CAT_CODIGO_CAVIDAD.xlsx', 'CAT_CODIGO_CAVIDAD', 'cat_codigo_cavidad', 'CodigoCavidadID', 'codigo_cavidad_id',
    [['CodigoCavidad', 'codigo_cavidad', 'text'], ['TipoCavidad', 'tipo_cavidad', 'text']]],
  ['CAT_ACETATO_ESTADO.xlsx', 'CAT_ACETATO_ESTADO', 'cat_acetato_estado', 'AcetatoEstadoID', 'acetato_estado_id',
    [['AcetatoEstado', 'acetato_estado', 'text'], ['Observaciones', 'observaciones', 'text']]],
  ['CAT_VIDRIO_ESTADO.xlsx', 'CAT_VIDRIO_ESTADO', 'cat_vidrio_estado', 'VidrioEstadoID', 'vidrio_estado_id',
    [['VidrioEstado', 'vidrio_estado', 'text'], ['Observaciones', 'observaciones', 'text']]],
  ['CAT_MARCO_PLACA_ESTADO.xlsx', 'CAT_MARCO_PLACA_ESTADO', 'cat_marco_placa_estado', 'MarcoPlacaEstadoID', 'marco_placa_estado_id',
    [['MarcoPlacaEstado', 'marco_placa_estado', 'text'], ['Observaciones', 'observaciones', 'text']]],
  ['CAT_CUERPO_PLACA_ESTADO.xlsx', 'CAT_CUERPO_PLACA_ESTADO', 'cat_cuerpo_placa_estado', 'CuerpoPlacaEstadoID', 'cuerpo_placa_estado_id',
    [['CuerpoPlacaEstado', 'cuerpo_placa_estado', 'text'], ['Observaciones', 'observaciones', 'text']]],
  ['CAT_PRIORIDAD_INTERVENCION.xlsx', 'CAT_PRIORIDAD_INTERVENCION', 'cat_prioridad_intervencion', 'PrioridadIntervencionID', 'prioridad_intervencion_id',
    [['Nombre', 'nombre', 'text'], ['Observaciones', 'observaciones', 'text']]],
  ['CAT_TIPO_INTERVALO_MUESTRA.xlsx', 'CAT_TIPO_INTERVALO_MUESTRA', 'cat_tipo_intervalo_muestra', 'TipoIntervaloMuestraID', 'tipo_intervalo_muestra_id',
    [['Tipo', 'tipo', 'text']]],
  ['CAT_TIPO_MUESTRA_SUBSUELO.xlsx', 'CAT_TIPO_MUESTRA_SUBSUELO', 'cat_tipo_muestra_subsuelo', 'TipoMuestraSubsueloID', 'tipo_muestra_subsuelo_id',
    [['Nombre', 'nombre', 'text']]],
  ['CAT_ROL_AUTOR.xlsx', 'CAT_ROL_AUTOR', 'cat_rol_autor', 'RolAutorID', 'rol_autor_id',
    [['CodigoRolAutor', 'codigo_rol_autor', 'text'], ['Nombre', 'nombre', 'text'], ['Descripcion', 'descripcion', 'text'],
     ['Activo', 'activo', 'boolean'], ['Observaciones', 'observaciones', 'text']]],
]

for (const [file, sheet, table, accessIdColumn, pk, fields] of simpleCatalogues) {
  const hasTimestamps = ['cat_clase_placa', 'cat_material_placa', 'cat_color_placa', 'cat_material_mueble', 'cat_color_mueble',
    'cat_material_bandeja', 'cat_columna_bandeja', 'cat_configuracion_rejilla', 'cat_tipo_proteccion',
    'cat_sistema_ensamble', 'cat_etapa_uso_placa', 'cat_estado_material', 'cat_recobro_cualitativo', 'cat_codigo_cavidad',
    'cat_acetato_estado', 'cat_vidrio_estado', 'cat_marco_placa_estado', 'cat_cuerpo_placa_estado', 'cat_prioridad_intervencion',
    'cat_tipo_intervalo_muestra', 'cat_tipo_muestra_subsuelo', 'cat_rol_autor'].includes(table)
  const columns = [pk, ...fields.map(([, column]) => column)]
  if (hasTimestamps) columns.push('created_at', 'updated_at')
  insert(
    table,
    pk,
    columns,
    loadSheet(file, sheet).map((row) => {
      const record = { [pk]: toInteger(row[accessIdColumn]) }
      for (const [source, column, kind] of fields) {
        record[column] = kind === 'integer' ? toInteger(row[source]) : kind === 'boolean' ? toBoolean(row[source]) : toText(row[source])
      }
      if (hasTimestamps) {
        record.created_at = NOW
        record.updated_at = NOW
      }
      return record
    }),
  )
}

insert(
  'cat_estado_catalogacion',
  'estado_catalogacion_id',
  ['estado_catalogacion_id', 'estado', 'significado', 'quien', 'created_at', 'updated_at'],
  loadSheet('CAT_ESTADO_CATALOGACION.xlsx', 'CAT_ESTADO_CATALOGACION').map((row) => ({
    estado_catalogacion_id: toInteger(row.EstadoCatalogacionID),
    estado: toText(row.Estado),
    significado: toText(row.Significado),
    quien: toText(row.Quien),
    created_at: NOW,
    updated_at: NOW,
  })),
)

const estadoRevision = loadSheet('CAT_ESTADO_REVISION.xlsx', 'CAT_ESTADO_REVISION')
const estadosRevisionSinSignificado = estadoRevision.filter((row) => isEmpty(row.Significado))
insert(
  'cat_estado_revision',
  'estado_revision_id',
  ['estado_revision_id', 'nombre', 'significado', 'created_at', 'updated_at'],
  estadoRevision.map((row) => ({
    estado_revision_id: toInteger(row.EstadoRevisionID),
    nombre: toText(row.Nombre),
    // significado is NOT NULL in the target schema while Access leaves it empty for the states
    // that mean "nothing to describe yet", so the empty string is the honest placeholder.
    significado: isEmpty(row.Significado) ? '' : toText(row.Significado),
    created_at: NOW,
    updated_at: NOW,
  })),
)
if (estadosRevisionSinSignificado.length) {
  note(
    `cat_estado_revision.significado is NOT NULL in the target schema and empty for ` +
      `${estadosRevisionSinSignificado.length} Access states (${estadosRevisionSinSignificado
        .map((row) => toText(row.Nombre))
        .join(', ')}); an empty string was used.`,
  )
}

const unidadMedida = loadSheet('CAT_UNIDAD_MEDIDA.xlsx', 'CAT_UNIDAD_MEDIDA')
insert(
  'cat_unidad_medida',
  'unidad_medida_id',
  ['unidad_medida_id', 'unidad', 'created_at', 'updated_at'],
  unidadMedida.map((row) => ({
    unidad_medida_id: toInteger(row.UnidadMedidaID),
    unidad: toText(row.Unidad),
    created_at: NOW,
    updated_at: NOW,
  })),
)
note(
  `cat_unidad_medida: only the "unidad" label survives; Simbolo, FactorUnidadPrincipal, FactorAPies, Sistema and the ` +
    `complement/unit relationship are dropped because the target table stores a single column. Source values: ` +
    `${unidadMedida.map((row) => `${row.UnidadMedidaID}=${row.Unidad}(${row.Simbolo})`).join(', ')}.`,
)

insert(
  'cat_metodo_adquisicion',
  'metodo_adquisicion_id',
  ['metodo_adquisicion_id', 'origen_muestra_id', 'codigo_metodo_adquisicion', 'nombre', 'tipo', 'created_at', 'updated_at'],
  loadSheet('CAT_METODO_ADQUISICION.xlsx', 'CAT_METODO_ADQUISICION').map((row) => ({
    metodo_adquisicion_id: toInteger(row.MetodoAdquisicionID),
    origen_muestra_id: toInteger(row.OrigenMuestraID),
    codigo_metodo_adquisicion: toText(row.CodigoMetodoAdquisicion),
    nombre: toText(row.Nombre),
    tipo: toText(row.Tipo),
    created_at: NOW,
    updated_at: NOW,
  })),
)

// ---------------------------------------------------------------- people

const personas = loadSheet('PERSONA.xlsx', 'PERSONA')
const personasSinCodigo = personas.filter((row) => isEmpty(row.CodigoPersona))
const personasSinNombre = personas.filter((row) => isEmpty(row.Nombre))
const personasSinCorreo = personas.filter((row) => isEmpty(row.Correo))
insert(
  'persona',
  'persona_id',
  ['persona_id', 'codigo_persona', 'nombre', 'apellidos', 'correo', 'activo', 'created_at', 'updated_at'],
  personas.map((row) => {
    const accessId = toInteger(row.PersonaID)
    return {
      persona_id: accessId + PERSONA_ID_OFFSET,
      // CodigoPersona and Correo are UNIQUE NOT NULL in the target schema and empty for every Access
      // row, so a deterministic placeholder derived from PersonaID is used. .invalid is reserved by
      // RFC 2606 and can never resolve to a real mailbox.
      codigo_persona: isEmpty(row.CodigoPersona) ? `ACCESS-${accessId}` : toText(row.CodigoPersona),
      nombre: isEmpty(row.Nombre) ? '' : toText(row.Nombre),
      apellidos: toText(row.Apellidos),
      correo: isEmpty(row.Correo) ? `sin-correo+${accessId}@access.invalid` : toText(row.Correo),
      activo: toBoolean(row.Activo, true),
      created_at: NOW,
      updated_at: NOW,
    }
  }),
)
note(
  `persona: Access PersonaID is translated with a +${PERSONA_ID_OFFSET} offset because persona_id = 1 already belongs to ` +
    `the bootstrap superadmin.`,
)
if (personasSinCodigo.length) {
  note(
    `persona.codigo_persona: CodigoPersona is empty for all ${personasSinCodigo.length} Access rows while the column is ` +
      `UNIQUE NOT NULL, so the placeholder ACCESS-<PersonaID> is used.`,
  )
}
if (personasSinCorreo.length) {
  note(
    `persona.correo: Correo is empty for all ${personasSinCorreo.length} Access rows while the column is UNIQUE NOT NULL, ` +
      `so the placeholder sin-correo+<PersonaID>@access.invalid is used (RFC 2606 reserved TLD, never resolvable).`,
  )
}
if (personasSinNombre.length) {
  note(
    `persona.nombre: Nombre is empty for all ${personasSinNombre.length} Access rows; PERSONA.xlsx only carries ` +
      `Apellidos, so every seeded person will render with a surname and no given name.`,
  )
}
note(
  `persona: Access PersonaID is translated with a +${PERSONA_ID_OFFSET} offset because persona_id = 1 already belongs to the ` +
    `bootstrap superadmin. correo is NOT NULL in the target schema and PERSONA.xlsx has no values, so an empty string is used.`,
)

const personaId = (value) => {
  if (isEmpty(value)) return null
  return toInteger(value) + PERSONA_ID_OFFSET
}

unresolved(
  'PERSONA.xlsx carries no given names, so every Access person is identified only by Apellidos. ' +
    'PersonaID 6 has Apellidos "Linares Murcia", which resembles the local bootstrap superadmin ' +
    '(codigo_persona "adrian"). Whether that is the same human is an identity decision, not a data ' +
    'migration, so the two rows are kept separate.',
)

// ---------------------------------------------------------------- core entities

insert(
  'coleccion',
  'coleccion_id',
  ['coleccion_id', 'codigo_coleccion', 'nombre_coleccion', 'institucion', 'responsable_coleccion', 'descripcion',
    'estado_coleccion', 'created_at', 'updated_at'],
  loadSheet('COLECCION.xlsx', 'COLECCION').map((row) => ({
    coleccion_id: toInteger(row.ColeccionID),
    codigo_coleccion: toText(row.CodigoColeccion),
    nombre_coleccion: toText(row.NombreColeccion),
    institucion: toText(row.Institucion),
    responsable_coleccion: toText(row.ResponsableColeccion),
    descripcion: toText(row.Descripcion),
    estado_coleccion: toText(row.EstadoColeccion),
    created_at: NOW,
    updated_at: NOW,
  })),
)

// Reported well names: every row of POZO_REPORTADO.xlsx is preserved as catalogued, plus any name
// that only appears in MUESTRA_SUBSUELO. Rows are never collapsed: POZO_REPORTADO deliberately
// carries both "ALMEJA-1" and "ALMEJA1", which normalize to the same key but are distinct reports.
const pozoReportadoRows = loadSheet('POZO_REPORTADO.xlsx', 'POZO_REPORTADO')
const muestraSubsueloRows = loadSheet('MUESTRA_SUBSUELO.xlsx', 'MUESTRA_SUBSUELO')

const reportedRows = pozoReportadoRows.map((row) => ({
  pozo_reportado_id: toInteger(row.PozoReportadoID),
  nombre_reportado: toText(row.NombreReportado),
  estado_revision_id: optionalId(row.EstadoRevisionID),
  catalogador_id: personaId(row.CatalogadorID),
  fecha_ingreso: toTimestamp(row.FechaIngreso),
  estado_catalogacion_id: toInteger(row.EstadoCatalogacionID),
  revisor_id: personaId(row.RevisorID),
  fecha_revision: toTimestamp(row.FechaRevision),
  observaciones: toText(row.Observaciones),
  catalogued: true,
}))

const cataloguedByExact = new Set(reportedRows.map((row) => row.nombre_reportado))
const cataloguedByNormalized = new Set(reportedRows.map((row) => normalizeName(row.nombre_reportado)))
// Synthetic ids must start above every id already present in the workbook, not above the row count:
// POZO_REPORTADO.xlsx ids are not contiguous.
let nextReportedId = reportedRows.reduce((max, row) => Math.max(max, row.pozo_reportado_id), 0) + 1
for (const row of muestraSubsueloRows) {
  const name = toText(row.PozoReportado)
  if (name === null) continue
  if (cataloguedByExact.has(name) || cataloguedByNormalized.has(normalizeName(name))) continue
  cataloguedByExact.add(name)
  cataloguedByNormalized.add(normalizeName(name))
  reportedRows.push({
    pozo_reportado_id: nextReportedId,
    nombre_reportado: name,
    estado_revision_id: null,
    catalogador_id: null,
    fecha_ingreso: null,
    estado_catalogacion_id: null,
    revisor_id: null,
    fecha_revision: null,
    observaciones: null,
    catalogued: false,
  })
  nextReportedId += 1
  unresolved(`MUESTRA_SUBSUELO.xlsx references reported well "${name}", which is absent from POZO_REPORTADO.xlsx. A pozo_reportado row with no cataloging metadata was added so the sample keeps its well.`)
}

insert(
  'pozo_reportado',
  'pozo_reportado_id',
  ['pozo_reportado_id', 'nombre_reportado', 'estado_revision_id', 'catalogador_id', 'fecha_ingreso',
    'estado_catalogacion_id', 'revisor_id', 'fecha_revision', 'observaciones'],
  reportedRows.map(({ catalogued, ...row }) => row),
)

// Access has no canonical well table, only reported names. One pozo is created per reported row so
// muestra_subsuelo.pozo_id stays resolvable without guessing merges. codigo_pozo is generated
// because the module carries no canonical identifier.
const pozoByReportedId = new Map()
let nextPozoId = 1
const pozoRows = reportedRows.map((row) => {
  const id = nextPozoId
  nextPozoId += 1
  pozoByReportedId.set(row.pozo_reportado_id, id)
  return {
    pozo_id: id,
    codigo_pozo: `PR-${String(id).padStart(3, '0')}`,
    nombre_pozo: row.nombre_reportado,
    cuenca_id: null,
    localizacion_geografica_id: null,
    localizacion_espacial_id: null,
    catalogador_id: row.catalogador_id,
    fecha_ingreso: row.fecha_ingreso,
    estado_catalogacion_id: row.estado_catalogacion_id,
    estado_revision_id: row.estado_revision_id,
    revisor_id: row.revisor_id,
    fecha_revision: row.fecha_revision,
    observaciones: null,
  }
})
insert(
  'pozo',
  'pozo_id',
  ['pozo_id', 'codigo_pozo', 'nombre_pozo', 'cuenca_id', 'localizacion_geografica_id', 'localizacion_espacial_id',
    'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id', 'estado_revision_id', 'revisor_id', 'fecha_revision',
    'observaciones'],
  pozoRows,
)
note(
  `pozo: the Access module has no canonical well registry, only POZO_REPORTADO. One pozo row is created per reported row ` +
    `with a generated codigo_pozo (PR-001...). ${pozoRows.length} wells were created from ${pozoReportadoRows.length} catalogued ` +
    `reported rows plus names found only in MUESTRA_SUBSUELO. No variants were merged.`,
)
insert(
  'rel_pozo_reportado_pozo',
  'rel_pozo_reportado_pozo_id',
  ['rel_pozo_reportado_pozo_id', 'pozo_reportado_id', 'pozo_id', 'observaciones'],
  reportedRows.map((row) => ({
    rel_pozo_reportado_pozo_id: row.pozo_reportado_id,
    pozo_reportado_id: row.pozo_reportado_id,
    pozo_id: pozoByReportedId.get(row.pozo_reportado_id),
    observaciones: null,
  })),
)

// MUESTRA_SUBSUELO keeps the reported well name as free text. Resolution prefers an exact name match
// and only then a normalized one, so "ALMEJA1" never resolves to the catalogued "ALMEJA-1".
const reportedByExact = new Map(reportedRows.map((row) => [row.nombre_reportado, row.pozo_reportado_id]))
const reportedByNormalized = new Map()
for (const row of reportedRows) {
  const key = normalizeName(row.nombre_reportado)
  if (!reportedByNormalized.has(key)) reportedByNormalized.set(key, row.pozo_reportado_id)
}
function resolvePozo(reportedName) {
  const name = toText(reportedName)
  if (name === null) return null
  const exact = reportedByExact.get(name)
  if (exact !== undefined) return exact
  const normalized = reportedByNormalized.get(normalizeName(name))
  return normalized !== undefined ? normalized : null
}

const resolvedByNormalizedOnly = new Map()
for (const row of muestraSubsueloRows) {
  const name = toText(row.PozoReportado)
  if (name === null || reportedByExact.has(name)) continue
  const target = resolvePozo(name)
  if (target === null) continue
  const targetName = reportedRows.find((entry) => entry.pozo_reportado_id === target).nombre_reportado
  if (!resolvedByNormalizedOnly.has(targetName)) resolvedByNormalizedOnly.set(targetName, new Set())
  resolvedByNormalizedOnly.get(targetName).add(name)
}
for (const [target, spellings] of resolvedByNormalizedOnly) {
  if (spellings.size === 1) {
    unresolved(`MUESTRA_SUBSUELO spells the catalogued well "${target}" as ${[...spellings].map((name) => `"${name}"`).join(', ')}; the sample was linked through a normalized-name match.`)
  }
}

// Reported names that collapse to the same normalized key would be a data bug, so they are
// checked. Names that only share a letter skeleton are reported as candidate spelling variants
// without being merged, because deciding whether they are the same well is a scientific call.
const normalizedCollisions = new Map()
for (const row of reportedRows) {
  const key = normalizeName(row.nombre_reportado)
  if (!normalizedCollisions.has(key)) normalizedCollisions.set(key, [])
  normalizedCollisions.get(key).push(row.nombre_reportado)
}
for (const [key, names] of normalizedCollisions) {
  if (names.length > 1) {
    unresolved(`Reported well spellings collapse to the same normalized key "${key}": ${names.map((name) => `"${name}"`).join(', ')}. These were kept separate.`)
  }
}

const skeletonGroups = new Map()
for (const row of reportedRows) {
  const skeleton = normalizeName(row.nombre_reportado).replace(/\d+/g, '')
  if (!skeleton) continue
  if (!skeletonGroups.has(skeleton)) skeletonGroups.set(skeleton, [])
  skeletonGroups.get(skeleton).push(row.nombre_reportado)
}
for (const [, names] of skeletonGroups) {
  if (names.length > 1) {
    unresolved(`Reported wells sharing the letter skeleton "${names[0].replace(/[0-9]/g, '')}" were kept separate: ${names.map((name) => `"${name}"`).join(', ')}. Merging them is a scientific decision.`)
  }
}

insert(
  'placa',
  'placa_id',
  ['placa_id', 'codigo_ubicacion', 'coleccion_id', 'codigo_placa', 'clase_placa_id', 'etapa_uso_placa_id',
    'diseno_placa_id', 'configuracion_cavidades_id', 'material_placa_id', 'color_placa_id', 'configuracion_rejilla_id',
    'tipo_proteccion_id', 'sistema_ensamble_id', 'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id',
    'revisor_id', 'fecha_revision', 'estado_revision_id', 'comentarios', 'observaciones'],
  loadSheet('PLACA.xlsx', 'PLACA').map((row) => ({
    placa_id: toInteger(row.PlacaID),
    codigo_ubicacion: toText(row.CodigoUbicacion),
    coleccion_id: toInteger(row.ColeccionID),
    codigo_placa: toText(row.CodigoPlaca),
    clase_placa_id: toInteger(row.ClasePlacaID),
    etapa_uso_placa_id: toInteger(row.EtapaUsoPlacaID),
    diseno_placa_id: toInteger(row.DisenoPlacaID),
    configuracion_cavidades_id: cavityIdMap.get(toInteger(row.ConfiguracionCavidadesID)) ?? null,
    material_placa_id: toInteger(row.MaterialPlacaID),
    color_placa_id: toInteger(row.ColorPlacaID),
    configuracion_rejilla_id: toInteger(row.ConfiguracionRejillaID),
    tipo_proteccion_id: toInteger(row.TipoProteccionID),
    sistema_ensamble_id: toInteger(row.SistemaEnsambleID),
    catalogador_id: personaId(row.CatalogadorID),
    fecha_ingreso: toTimestamp(row.FechaIngreso),
    estado_catalogacion_id: toInteger(row.EstadoCatalogacionID),
    revisor_id: personaId(row.RevisorID),
    fecha_revision: toTimestamp(row.FechaRevision),
    estado_revision_id: optionalId(row.EstadoRevisionID),
    comentarios: toText(row.Comentarios),
    observaciones: toText(row.Observaciones),
  })),
)

insert(
  'muestra',
  'muestra_id',
  ['muestra_id', 'nombre_muestra_original', 'codigo_muestra_sistema', 'origen_muestra_id', 'metodo_adquisicion_id',
    'catalogador_id', 'fecha_ingreso', 'revisor_id', 'fecha_revision', 'estado_catalogacion_id', 'observaciones'],
  loadSheet('MUESTRA.xlsx', 'MUESTRA').map((row) => ({
    muestra_id: toInteger(row.MuestraID),
    nombre_muestra_original: toText(row.NombreMuestraOriginal),
    codigo_muestra_sistema: toText(row.CodigoMuestraSistema),
    origen_muestra_id: toInteger(row.OrigenMuestraID),
    metodo_adquisicion_id: toInteger(row.MetodoAdquisicionID),
    catalogador_id: personaId(row.CatalogadorID),
    fecha_ingreso: toTimestamp(row.FechaIngreso),
    revisor_id: personaId(row.RevisorID),
    fecha_revision: toTimestamp(row.FechaRevision),
    estado_catalogacion_id: toInteger(row.EstadoCatalogacionID),
    observaciones: toText(row.Observaciones),
  })),
)

const convertUnitById = new Map(unidadMedida.map((row) => [toInteger(row.UnidadMedidaID), toInteger(row.UnidadMedidaID)]))
insert(
  'muestra_subsuelo',
  'muestra_subsuelo_id',
  ['muestra_subsuelo_id', 'muestra_id', 'tipo_muestra_subsuelo_id', 'pozo_id', 'tipo_intervalo_muestra_id',
    'profundidad_tope', 'profundidad_base', 'unidad_medida_id', 'intervalo_nucleo'],
  muestraSubsueloRows.map((row) => ({
    muestra_subsuelo_id: toInteger(row.MuestraSubsueloID),
    muestra_id: toInteger(row.MuestraID),
    tipo_muestra_subsuelo_id: toInteger(row.TipoMuestraSubsueloID),
    pozo_id: resolvePozo(row.PozoReportado) === null ? null : pozoByReportedId.get(resolvePozo(row.PozoReportado)),
    tipo_intervalo_muestra_id: toInteger(row.TipoIntervaloMuestraID),
    profundidad_tope: toDepth(row.ProfTopeConvertida),
    profundidad_base: toDepth(row.ProfBaseConvertida),
    unidad_medida_id: convertUnitById.get(toInteger(row.UnidadConvertidaID)) ?? null,
    intervalo_nucleo: null,
  })),
)
note(
  'muestra_subsuelo: the target schema stores the already-converted depth plus a single unit, so ProfTopeConvertida / ' +
    'ProfBaseConvertida and UnidadConvertidaID are used. ProfTopeV1/V2, ProfBaseV1/V2, ProfTopeUnidad1/2, ProfBaseUnidad1/2, ' +
    'ProfReferenciaTope/Base and UnidadReferenciaID are dropped. NucleoID and SeccionNucleoID are 0 (no data) and are dropped.',
)
note(
  'muestra_subsuelo: profundidad_tope/profundidad_base are numeric in the target schema, so the converted decimal depths ' +
    'from ProfTopeConvertida / ProfBaseConvertida are preserved exactly (e.g. feet-plus-inches values such as 10449.916663).',
)

const unreferencedNucleo = muestraSubsueloRows.filter((row) => !isEmpty(row.NucleoID) && toInteger(row.NucleoID) !== 0)
if (unreferencedNucleo.length) {
  unresolved(`${unreferencedNucleo.length} MUESTRA_SUBSUELO rows carry a non-zero NucleoID that has no matching NUCLEO row. intervalo_nucleo was left NULL.`)
}

// ---------------------------------------------------------------- taxonomies

const dicAutorRows = loadSheet('DIC_AUTOR.xlsx', 'DIC_AUTOR')
insert(
  'dic_autor',
  'autor_id',
  ['autor_id', 'codigo_autor', 'nombre_autor', 'tipo_autor_id', 'entidad_id', 'especialidad_id', 'observaciones'],
  dicAutorRows.map((row) => ({
    autor_id: toInteger(row.AutorID),
    codigo_autor: toText(row.CodigoAutor),
    nombre_autor: toText(row.NombreAutor),
    tipo_autor_id: null,
    entidad_id: null,
    especialidad_id: null,
    observaciones: toText(row.Comentarios),
  })),
)
note(
  `dic_autor: tipo_autor_id is NULL for all ${dicAutorRows.length} rows. The source values 1/2/3 are consistent with ` +
    'person/company/institution but the module ships no CAT_TIPO_AUTOR, CAT_ENTIDAD or CAT_ESPECIALIDAD data, so no catalogue was invented.',
)

const dicTaxonRows = loadSheet('DIC_TAXON_REPORTADO.xlsx', 'DIC_TAXON_REPORTADO')
insert(
  'dic_taxon_reportado',
  'taxon_reportado_id',
  ['taxon_reportado_id', 'nombre_reportado', 'autor_taxon_reportado', 'estado_revision_id', 'catalogador_id',
    'fecha_ingreso', 'revisor_id', 'fecha_revision', 'observaciones'],
  dicTaxonRows.map((row) => ({
    taxon_reportado_id: toInteger(row.TaxonReportadoID),
    nombre_reportado: toText(row.NombreReportado),
    autor_taxon_reportado: toText(row.AutorTaxonReportado),
    estado_revision_id: optionalId(row.EstadoRevisionID),
    catalogador_id: personaId(row.CatalogadorID),
    fecha_ingreso: toTimestamp(row.FechaIngreso),
    revisor_id: personaId(row.RevisorID),
    fecha_revision: toTimestamp(row.FechaRevision),
    observaciones: toText(row.Observaciones),
  })),
)

insert(
  'rel_muestra_taxon_reportado',
  'rel_muestra_taxon_reportado_id',
  ['rel_muestra_taxon_reportado_id', 'muestra_id', 'taxon_reportado_id', 'orden_registro', 'tipo_duda_id', 'comentario_catalogador'],
  loadSheet('REL_MUESTRA_TAXON_REPORTADO.xlsx', 'REL_MUESTRA_TAXON_REPORTADO').map((row) => ({
    rel_muestra_taxon_reportado_id: toInteger(row.RelMuestraTaxonReportadoID),
    muestra_id: toInteger(row.MuestraID),
    taxon_reportado_id: toInteger(row.TaxonReportadoID),
    orden_registro: toInteger(row.OrdenRegistro),
    tipo_duda_id: toInteger(row.TipoDudaID),
    comentario_catalogador: toText(row.Comentarios),
  })),
)

const relPlacaAutor = loadSheet('REL_PLACA_AUTOR.xlsx', 'REL_PLACA_AUTOR')
skipped(
  `rel_placa_autor: all ${relPlacaAutor.length} rows have AutorID and RolAutorID empty, so nothing meaningful could be seeded.`,
)
skipped('NUCLEO.xlsx and SECCION_NUCLEO.xlsx: single placeholder rows whose foreign keys are 0 or unresolved.')
skipped('BANDEJAS_POR_MUEBLE.xlsx and BANDEJAS_POR_ZONA.xlsx: reconciliation reports, not entities. Their published totals are reconciled against the loaded rows by scripts/verify-access-catalogacion-seed.mjs instead.')
skipped('CAT_ROL.xlsx: the 10 Access roles (Catalogador cientifico, Revisor cientifico, ...) are a different vocabulary from the ' +
  'runtime roles already in cat_rol (Catalogador, Revisor, Curador, Administrador), so they were not merged.')

// ---------------------------------------------------------------- furniture and trays

const seccionIds = new Set(loadSheet('CAT_SECCION.xlsx', 'CAT_SECCION').map((row) => toInteger(row.SeccionID)))
const zoneMuebleRows = loadSheet('ZONA_MUEBLE.xlsx', 'ZONA_MUEBLE')
const danglingSections = [...new Set(zoneMuebleRows.map((row) => toInteger(row.SeccionMuebleID)).filter((id) => !seccionIds.has(id)))]
const unresolvedZones = zoneMuebleRows.filter((row) => resolveZonaId(row.NombreZona) === null)
insert(
  'zona_mueble',
  'zona_mueble_id',
  ['zona_mueble_id', 'seccion_mueble_id', 'zona_id', 'nombre_zona', 'orden_zona', 'observaciones'],
  zoneMuebleRows.map((row) => {
    const sectionId = toInteger(row.SeccionMuebleID)
    return {
      zona_mueble_id: toInteger(row.ZonaMuebleID),
      seccion_mueble_id: seccionIds.has(sectionId) ? sectionId : null,
      zona_id: resolveZonaId(row.NombreZona),
      nombre_zona: toText(row.NombreZona),
      orden_zona: toInteger(row.OrdenZona),
      observaciones: toText(row.Observaciones),
    }
  }),
)
if (danglingSections.length) {
  note(
    `zona_mueble: ${zoneMuebleRows.filter((row) => !seccionIds.has(toInteger(row.SeccionMuebleID))).length}/${zoneMuebleRows.length} ` +
    `rows reference SeccionMuebleID values that CAT_SECCION.xlsx does not define (${danglingSections.join(', ')}). The Access ` +
    'SeccionMuebleID is a per-furniture section, not the generic Superior/Inferior catalogue, so seccion_mueble_id is NULL for those rows.',
  )
}
if (unresolvedZones.length) {
  unresolved(`${unresolvedZones.length} ZONA_MUEBLE rows could not be mapped to a CAT_ZONA zone id by NombreZona.`)
} else {
  note(`zona_mueble: all ${zoneMuebleRows.length} rows resolved NombreZona to a CAT_ZONA zona_id.`)
}

insert(
  'mueble',
  'mueble_id',
  ['mueble_id', 'codigo_mueble', 'material_mueble_id', 'color_mueble_id', 'tiene_secciones', 'tiene_zonas',
    'observaciones', 'created_at', 'updated_at'],
  loadSheet('MUEBLE.xlsx', 'MUEBLE').map((row) => ({
    mueble_id: toInteger(row.MuebleID),
    codigo_mueble: toText(row.CodigoMueble),
    material_mueble_id: toInteger(row.MaterialMuebleID),
    color_mueble_id: toInteger(row.ColorMuebleID),
    tiene_secciones: toBoolean(row.TieneSecciones),
    tiene_zonas: toBoolean(row.TieneZonas),
    observaciones: toText(row.Observaciones),
    created_at: NOW,
    updated_at: NOW,
  })),
)

const bandejaRows = loadSheet('BANDEJA.xlsx', 'BANDEJA')
insert(
  'bandeja',
  'bandeja_id',
  ['bandeja_id', 'zona_mueble_id', 'numero_bandeja', 'material_bandeja_id', 'capacidad_placas_bandeja',
    'bandeja_tiene_separadores_internos', 'observaciones'],
  bandejaRows.map((row) => ({
    bandeja_id: toInteger(row.BandejaID),
    zona_mueble_id: toInteger(row.ZonaMuebleID),
    numero_bandeja: toInteger(row.NumeroBandeja),
    material_bandeja_id: toInteger(row.MaterialBandejaID),
    capacidad_placas_bandeja: toInteger(row.CapacidadPlacasBandeja),
    bandeja_tiene_separadores_internos: toBoolean(row.BandejaTieneSeparadoresInternos),
    observaciones: toText(row.Observaciones),
  })),
)

const plateWithoutLocation = { count: 0 }

// ---------------------------------------------------------------- plate observations

const ubicacionRows = loadSheet('UBICACION_FISICA.xlsx', 'UBICACION_FISICA')
insert(
  'ubicacion_fisica',
  'ubicacion_fisica_id',
  ['ubicacion_fisica_id', 'codigo_ubicacion', 'placa_id', 'bandeja_id', 'columna_bandeja_id', 'posicion_bandeja',
    'fecha_ubicacion', 'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id', 'revisor_id', 'fecha_revision',
    'estado_revision_id', 'observaciones'],
  ubicacionRows.map((row) => ({
    ubicacion_fisica_id: toInteger(row.UbicacionFisicaID),
    codigo_ubicacion: toText(row.CodigoUbicacion),
    placa_id: toInteger(row.PlacaID),
    bandeja_id: toInteger(row.BandejaID),
    columna_bandeja_id: toInteger(row.ColumnaBandejaID),
    posicion_bandeja: toInteger(row.PosicionBandeja),
    fecha_ubicacion: toTimestamp(row.FechaUbicacion),
    catalogador_id: personaId(row.CatalogadorID),
    fecha_ingreso: toTimestamp(row.FechaIngreso),
    estado_catalogacion_id: toInteger(row.EstadoCatalogacionID),
    revisor_id: personaId(row.RevisorID),
    fecha_revision: toTimestamp(row.FechaRevision),
    estado_revision_id: optionalId(row.EstadoRevisionID),
    observaciones: toText(row.Observaciones),
  })),
)

const disposicionRows = loadSheet('DISPOSICION_MATERIAL.xlsx', 'DISPOSICION_MATERIAL')
const cavitiesWithoutSample = disposicionRows.filter((row) => isEmpty(row.MuestraID))
insert(
  'disposicion_material',
  'disposicion_material_id',
  ['disposicion_material_id', 'placa_id', 'muestra_id', 'codigo_cavidad_id', 'numero_cavidad', 'tiene_material',
    'estado_material_id', 'recobro_cualitativo_id', 'estado_catalogacion_id', 'revisor_id', 'fecha_revision',
    'catalogador_id', 'fecha_ingreso', 'observaciones'],
  disposicionRows.map((row) => ({
    disposicion_material_id: toInteger(row.DisposicionMaterialID),
    placa_id: toInteger(row.PlacaID),
    muestra_id: isEmpty(row.MuestraID) ? null : toInteger(row.MuestraID),
    codigo_cavidad_id: toInteger(row.CodigoCavidadID),
    numero_cavidad: toText(row.NumeroCavidad),
    tiene_material: toBoolean(row.TieneMaterial),
    estado_material_id: optionalId(row.EstadoMaterialID),
    recobro_cualitativo_id: optionalId(row.RecobroCualitativoID),
    estado_catalogacion_id: toInteger(row.EstadoCatalogacionID),
    revisor_id: personaId(row.RevisorID),
    fecha_revision: toTimestamp(row.FechaRevision),
    catalogador_id: personaId(row.CatalogadorID),
    fecha_ingreso: toTimestamp(row.FechaIngreso),
    observaciones: toText(row.Observaciones),
  })),
)
note(`disposicion_material: ${cavitiesWithoutSample.length}/${disposicionRows.length} cavities have no MuestraID (they are empty cavities), so muestra_id is NULL for them.`)

insert(
  'marcado_placa',
  'marcado_placa_id',
  ['marcado_placa_id', 'placa_id', 'tinta_negra', 'tinta_azul', 'tinta_roja', 'tinta_verde', 'lapiz', 'impresion_negro',
    'impresion_azul', 'etiqueta_adherida', 'observaciones', 'catalogador_id', 'fecha_ingreso', 'revisor_id',
    'fecha_revision', 'estado_catalogacion_id'],
  loadSheet('MARCADO_PLACA.xlsx', 'MARCADO_PLACA').map((row) => ({
    marcado_placa_id: toInteger(row.MarcadoPlacaID),
    placa_id: toInteger(row.PlacaID),
    tinta_negra: toBoolean(row.TintaNegra),
    tinta_azul: toBoolean(row.TintaAzul),
    tinta_roja: toBoolean(row.TintaRoja),
    tinta_verde: toBoolean(row.TintaVerde),
    lapiz: toBoolean(row.Lapiz),
    impresion_negro: toBoolean(row.ImpresionNegro),
    impresion_azul: toBoolean(row.ImpresionAzul),
    etiqueta_adherida: toBoolean(row.EtiquetaAdherida),
    observaciones: toText(row.Observaciones),
    catalogador_id: personaId(row.CatalogadorID),
    fecha_ingreso: toTimestamp(row.FechaIngreso),
    revisor_id: personaId(row.RevisorID),
    fecha_revision: toTimestamp(row.FechaRevision),
    estado_catalogacion_id: toInteger(row.EstadoCatalogacionID),
  })),
)

const conservationRows = loadSheet('ESTADO_CONSERVACION_INICIAL.xlsx', 'ESTADO_CONSERVACION_INICIAL')
insert(
  'estado_conservacion_inicial',
  'estado_conservacion_inicial_id',
  ['estado_conservacion_inicial_id', 'placa_id', 'vidrio_estado_id', 'acetato_estado_id', 'marco_placa_estado_id',
    'cuerpo_placa_estado_id', 'presencia_hongos', 'crecimiento_cristales', 'oxidacion', 'material_fuera_cavidad',
    'riesgo_contaminacion', 'observaciones', 'prioridad_intervencion_id', 'estado_catalogacion_id', 'revisor_id',
    'fecha_revision', 'catalogador_id', 'fecha_ingreso'],
  conservationRows.map((row) => ({
    estado_conservacion_inicial_id: toInteger(row.EstadoConservacionInicialID),
    placa_id: toInteger(row.PlacaID),
    vidrio_estado_id: toInteger(row.VidrioEstadoID),
    acetato_estado_id: toInteger(row.AcetatoEstadoID),
    marco_placa_estado_id: toInteger(row.MarcoPlacaEstadoID),
    cuerpo_placa_estado_id: optionalId(row.CuerpoPlacaEstadoID),
    presencia_hongos: toBoolean(row.PresenciaHongos),
    crecimiento_cristales: toBoolean(row.CrecimientoCristales),
    oxidacion: toBoolean(row.Oxidacion),
    material_fuera_cavidad: toBoolean(row.MaterialFueraCavidad),
    riesgo_contaminacion: toBoolean(row.RiesgoContaminacion),
    observaciones: toText(row.Observaciones),
    prioridad_intervencion_id: optionalId(row.PrioridadIntervencionID),
    estado_catalogacion_id: toInteger(row.EstadoCatalogacionID),
    revisor_id: personaId(row.RevisorID),
    fecha_revision: toTimestamp(row.FechaRevision),
    catalogador_id: personaId(row.CatalogadorID),
    fecha_ingreso: toTimestamp(row.FechaIngreso),
  })),
)

const anotacionRows = loadSheet('ANOTACION_PLACA.xlsx', 'ANOTACION_PLACA')
const anotacionSeed = []
let nextAnotacionId = 1
for (const row of anotacionRows) {
  for (const position of ANNOTATION_POSITIONS) {
    const text = toText(row[position.column])
    if (text === null) continue
    anotacionSeed.push({
      anotacion_id: nextAnotacionId,
      placa_id: toInteger(row.PlacaID),
      posicion_anotacion_id: position.id,
      codigo_posicion: position.nombre,
      texto_anotacion: text,
      estado_catalogacion_id: toInteger(row.EstadoCatalogacionID),
      revisor_id: personaId(row.RevisorID),
      fecha_revision: toTimestamp(row.FechaRevision),
      catalogador_id: personaId(row.CatalogadorID),
      fecha_ingreso: toTimestamp(row.FechaIngreso),
    })
    nextAnotacionId += 1
  }
}
insert(
  'anotacion_placa',
  'anotacion_id',
  ['anotacion_id', 'placa_id', 'posicion_anotacion_id', 'codigo_posicion', 'texto_anotacion', 'estado_catalogacion_id',
    'revisor_id', 'fecha_revision', 'catalogador_id', 'fecha_ingreso'],
  anotacionSeed,
)
note(
  `anotacion_placa: ANOTACION_PLACA stores four position columns per plate (Izquierda/Derecha/Arriba/Abajo) while the target ` +
  `schema is one row per annotation. ${anotacionRows.length} plates produced ${anotacionSeed.length} rows; empty positions were skipped. ` +
  'Access line breaks (CR CR LF) were normalised to LF and blank lines removed.',
)

void plateWithoutLocation

// ---------------------------------------------------------------- output

const header = [
  '-- GeoTrace seed: Access catalogacion module (sql/modulo_catalogacion_placas_pozos).',
  '-- Generated by scripts/generate-seed-access-catalogacion.mjs -- do not edit by hand.',
  '-- Regenerate with: pnpm run seed:generate',
  '--',
  '-- Access primary keys are preserved verbatim because every destination table is empty in the target',
  '-- database, so the seed stays traceable to the source module. Every primary key in the schema is',
  '-- GENERATED ALWAYS, hence the explicit OVERRIDING SYSTEM VALUE on each statement.',
  '--',
  '-- Access PersonaID is translated with a +' + PERSONA_ID_OFFSET + ' offset so it never collides with the',
  '-- bootstrap superadmin at persona_id = 1.',
  '--',
  '-- Re-running this file is safe: every statement upserts on its primary key.',
  '--',
  '-- Transformations applied:',
  ...report.notes.map((entry) => `--   - ${entry}`),
  '--',
  '-- Sources intentionally not seeded:',
  ...report.skipped.map((entry) => `--   - ${entry}`),
  '',
  'BEGIN;',
  '',
  'SET LOCAL standard_conforming_strings = on;',
  '',
  ...statements,
  'COMMIT;',
  '',
].join('\n')

mkdirSync(dirname(outputFile), { recursive: true })
writeFileSync(outputFile, header, 'utf8')

const totalRows = counts.reduce((total, [, rows]) => total + rows, 0)
console.log(`Wrote ${outputFile}`)
console.log(`${counts.length} tables, ${totalRows} rows\n`)
for (const [table, rows] of counts) console.log(`  ${String(rows).padStart(5)}  ${table}`)
if (report.unresolved.length) {
  console.log(`\n${report.unresolved.length} item(s) needing a human decision:`)
  for (const entry of report.unresolved) console.log(`  - ${entry}`)
}