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
    columns: ['codigo_pozo', 'nombre_pozo', 'cuenca_id', 'localizacion_geografica_id', 'localizacion_espacial_id', 'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id', 'estado_revision_id', 'revisor_id', 'fecha_revision', 'observaciones'],
    sample: { codigo_pozo: 'POZ-001', nombre_pozo: 'Pozo de ejemplo', cuenca_id: null, localizacion_geografica_id: null, localizacion_espacial_id: null, catalogador_id: null, fecha_ingreso: '', estado_catalogacion_id: null, estado_revision_id: null, revisor_id: null, fecha_revision: '', observaciones: '' },
  },
  placa: {
    label: 'Placas',
    columns: ['codigo_ubicacion', 'coleccion_id', 'codigo_placa', 'clase_placa_id', 'etapa_uso_placa_id', 'diseno_placa_id', 'configuracion_cavidades_id', 'material_placa_id', 'color_placa_id', 'configuracion_rejilla_id', 'tipo_proteccion_id', 'sistema_ensamble_id', 'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id', 'revisor_id', 'fecha_revision', 'estado_revision_id', 'comentarios', 'observaciones'],
    sample: { codigo_ubicacion: '', coleccion_id: null, codigo_placa: 'PL-000001', clase_placa_id: null, etapa_uso_placa_id: null, diseno_placa_id: null, configuracion_cavidades_id: null, material_placa_id: null, color_placa_id: null, configuracion_rejilla_id: null, tipo_proteccion_id: null, sistema_ensamble_id: null, catalogador_id: null, fecha_ingreso: '', estado_catalogacion_id: null, revisor_id: null, fecha_revision: '', estado_revision_id: null, comentarios: '', observaciones: '' },
  },
  muestra: {
    label: 'Muestras',
    columns: ['coleccion_id', 'nombre_muestra_original', 'codigo_muestra_sistema', 'origen_muestra_id', 'metodo_adquisicion_id', 'catalogador_id', 'fecha_ingreso', 'revisor_id', 'fecha_revision', 'estado_catalogacion_id', 'observaciones'],
    sample: { coleccion_id: null, nombre_muestra_original: 'Muestra de ejemplo', codigo_muestra_sistema: 'M-001', origen_muestra_id: null, metodo_adquisicion_id: null, catalogador_id: null, fecha_ingreso: '', revisor_id: null, fecha_revision: '', estado_catalogacion_id: null, observaciones: '' },
  },
  dic_uni_lito_reportada: { label: 'Unidades lito reportadas', columns: ['codigo_uni_lito_reportada', 'nombre_reportado', 'catalogador_id', 'fecha_ingreso', 'revisor_id', 'fecha_revision', 'estado_revision_id', 'observaciones'], sample: { codigo_uni_lito_reportada: 'ULR-001', nombre_reportado: 'Unidad de ejemplo', catalogador_id: null, fecha_ingreso: '', revisor_id: null, fecha_revision: '', estado_revision_id: null, observaciones: '' } },
  dic_uni_lito_normalizada: { label: 'Unidades lito normalizadas', columns: ['cod_uni_lito_normalizada', 'nombre_normalizado', 'rango_lito_id', 'referencia_bibliografica_id', 'observaciones', 'revisor_id', 'estado_revision_id', 'fecha_revision'], sample: { cod_uni_lito_normalizada: 'ULN-001', nombre_normalizado: 'Unidad normalizada', rango_lito_id: null, referencia_bibliografica_id: null, observaciones: '', revisor_id: null, estado_revision_id: null, fecha_revision: '' } },
  dic_uni_lito_actualizada: { label: 'Unidades lito actualizadas', columns: ['cod_uni_lito_actualizada', 'nombre_oficial', 'rango_lito_id', 'estado_nomenclatura_id', 'revisor_id', 'fecha_revision', 'estado_revision_id', 'observaciones'], sample: { cod_uni_lito_actualizada: 'ULA-001', nombre_oficial: 'Unidad oficial', rango_lito_id: null, estado_nomenclatura_id: null, revisor_id: null, fecha_revision: '', estado_revision_id: null, observaciones: '' } },
  dic_biozona_reportada: { label: 'Biozonas reportadas', columns: ['nombre_reportado', 'autor_biozona_reportada', 'codigo_biozona', 'estado_revision_id', 'catalogador_id', 'fecha_ingreso', 'revisor_id', 'fecha_revision', 'observaciones'], sample: { nombre_reportado: 'Biozona de ejemplo', autor_biozona_reportada: '', codigo_biozona: 'BZ-001', estado_revision_id: null, catalogador_id: null, fecha_ingreso: '', revisor_id: null, fecha_revision: '', observaciones: '' } },
  dic_biozona_normalizada: { label: 'Biozonas normalizadas', columns: ['nombre_normalizado', 'codigo_biozona', 'autor_biozona_normalizada', 'estado_revision_id', 'revisor_id', 'fecha_revision', 'observaciones'], sample: { nombre_normalizado: 'Biozona normalizada', codigo_biozona: 'BZ-001', autor_biozona_normalizada: '', estado_revision_id: null, revisor_id: null, fecha_revision: '', observaciones: '' } },
  dic_biozona_actualizada: { label: 'Biozonas actualizadas', columns: ['nombre_actualizado', 'codigo_biozona_actual', 'fuente_actualizacion', 'fecha_actualizacion', 'revisor_id', 'fecha_revision', 'estado_revision_id', 'observaciones'], sample: { nombre_actualizado: 'Biozona actualizada', codigo_biozona_actual: 'BZ-001', fuente_actualizacion: '', fecha_actualizacion: '', revisor_id: null, fecha_revision: '', estado_revision_id: null, observaciones: '' } },
  dic_edad_reportada: { label: 'Edades reportadas', columns: ['nombre_reportado', 'estado_revision_id', 'catalogador_id', 'fecha_ingreso', 'revisor_id', 'fecha_revision', 'observaciones'], sample: { nombre_reportado: 'Edad de ejemplo', estado_revision_id: null, catalogador_id: null, fecha_ingreso: '', revisor_id: null, fecha_revision: '', observaciones: '' } },
  dic_edad_normalizada: { label: 'Edades normalizadas', columns: ['nombre_normalizado', 'rango_cronoestratigrafico_id', 'estado_revision_id', 'revisor_id', 'fecha_revision', 'observaciones'], sample: { nombre_normalizado: 'Edad normalizada', rango_cronoestratigrafico_id: null, estado_revision_id: null, revisor_id: null, fecha_revision: '', observaciones: '' } },
  dic_edad_actualizada: { label: 'Edades actualizadas', columns: ['nombre_actualizado', 'escala_tiempo', 'fuente_actualizacion', 'revisor_id', 'fecha_revision', 'estado_revision_id', 'observaciones'], sample: { nombre_actualizado: 'Edad actualizada', escala_tiempo: '', fuente_actualizacion: '', revisor_id: null, fecha_revision: '', estado_revision_id: null, observaciones: '' },
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
