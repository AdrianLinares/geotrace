import * as XLSX from 'xlsx'
import type { ImportBatch, ImportTable } from './importApi'

export const TABLE_CONFIG = {
  coleccion: {
    label: 'Colecciones',
    columns: ['codigo_coleccion', 'nombre_coleccion', 'institucion', 'responsable_coleccion', 'descripcion', 'estado_coleccion'],
    sample: { codigo_coleccion: 'COL-005', nombre_coleccion: 'Nueva Colección', institucion: 'SGC', responsable_coleccion: 'Nombre', descripcion: '', estado_coleccion: 'Activa' },
  },
  pozo: {
    label: 'Pozos',
    columns: ['codigo_pozo', 'nombre_pozo', 'cuenca_id', 'localizacion_geografica_id', 'localizacion_espacial_id', 'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id', 'estado_revision_id', 'revisor_id', 'observaciones'],
    sample: { codigo_pozo: 'POZ-001', nombre_pozo: 'Pozo de ejemplo', cuenca_id: null, localizacion_geografica_id: null, localizacion_espacial_id: null, catalogador_id: null, fecha_ingreso: '', estado_catalogacion_id: null, estado_revision_id: null, revisor_id: null, observaciones: '' },
  },
  placa: {
    label: 'Placas',
    columns: ['codigo_ubicacion', 'coleccion_id', 'codigo_placa', 'clase_placa_id', 'etapa_uso_placa_id', 'diseno_placa_id', 'configuracion_cavidades_id', 'material_placa_id', 'color_placa_id', 'configuracion_rejilla_id', 'tipo_proteccion_id', 'sistema_ensamble_id', 'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id', 'revisor_id', 'estado_revision_id', 'comentarios', 'observaciones'],
    sample: { codigo_ubicacion: '', coleccion_id: null, codigo_placa: 'PL-000001', clase_placa_id: null, etapa_uso_placa_id: null, diseno_placa_id: null, configuracion_cavidades_id: null, material_placa_id: null, color_placa_id: null, configuracion_rejilla_id: null, tipo_proteccion_id: null, sistema_ensamble_id: null, catalogador_id: null, fecha_ingreso: '', estado_catalogacion_id: null, revisor_id: null, estado_revision_id: null, comentarios: '', observaciones: '' },
  },
  muestra: {
    label: 'Muestras',
    columns: ['nombre_muestra_original', 'codigo_muestra_sistema', 'origen_muestra_id', 'metodo_adquisicion_id', 'catalogador_id', 'fecha_ingreso', 'revisor_id', 'estado_catalogacion_id', 'observaciones'],
    sample: { nombre_muestra_original: 'Muestra de ejemplo', codigo_muestra_sistema: 'M-001', origen_muestra_id: null, metodo_adquisicion_id: null, catalogador_id: null, fecha_ingreso: '', revisor_id: null, estado_catalogacion_id: null, observaciones: '' },
  },
} as const

export type TableKey = keyof typeof TABLE_CONFIG
export type TableMappings = Partial<Record<TableKey, Record<string, string>>>
export type HeadersByTable = Partial<Record<TableKey, string[]>>

export function readHeadersForTables(workbook: XLSX.WorkBook, selectedTables: Iterable<TableKey>): HeadersByTable {
  const headersByTable: HeadersByTable = {}
  for (const table of selectedTables) {
    const sheet = workbook.Sheets[TABLE_CONFIG[table].label]
    if (!sheet) throw new Error(`Hoja "${TABLE_CONFIG[table].label}" no encontrada.`)
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as unknown[][]
    const headers = (rows[0] ?? []).filter((header): header is string => typeof header === 'string' && header.trim().length > 0)
    if (!headers.length) throw new Error(`La hoja "${TABLE_CONFIG[table].label}" no tiene encabezados.`)
    headersByTable[table] = headers
  }
  return headersByTable
}

export function buildImportBatches(
  workbook: XLSX.WorkBook,
  selectedTables: Iterable<TableKey>,
  mappings: TableMappings,
): ImportBatch[] {
  const batches: ImportBatch[] = []
  for (const table of selectedTables) {
    const sheet = workbook.Sheets[TABLE_CONFIG[table].label]
    if (!sheet) throw new Error(`Hoja "${TABLE_CONFIG[table].label}" no encontrada.`)
    const mapping = mappings[table]
    if (!mapping || !Object.values(mapping).some(Boolean)) {
      throw new Error(`La hoja "${TABLE_CONFIG[table].label}" no tiene un mapeo configurado.`)
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { blankrows: false })
    const columns = TABLE_CONFIG[table].columns as readonly string[]
    const mapped = rows
      .map((row) => Object.fromEntries(Object.entries(mapping)
        .filter(([excelColumn, databaseColumn]) => databaseColumn && columns.includes(databaseColumn) && row[excelColumn] !== undefined && row[excelColumn] !== '')
        .map(([excelColumn, databaseColumn]) => [databaseColumn, row[excelColumn]])))
      .filter((row) => Object.keys(row).length > 0)
    if (!mapped.length) throw new Error(`La hoja "${TABLE_CONFIG[table].label}" no contiene filas válidas para su mapeo.`)
    batches.push({ table: table as ImportTable, rows: mapped })
  }
  return batches
}
