import { z } from 'zod'
import type { ImportTable, ImportRow } from './types'

const id = z.coerce.number().int().positive().nullable().optional()
const text = (max = 255) => z.string().max(max).nullable().optional()
const date = z.string().datetime({ offset: true }).nullable().optional()
const schemas = {
  coleccion: z.object({ codigo_coleccion: text(), nombre_coleccion: text(), institucion: text(), responsable_coleccion: text(), descripcion: text(10000), estado_coleccion: text() }).strict(),
  pozo: z.object({ codigo_pozo: text(), nombre_pozo: text(), cuenca_id: id, localizacion_geografica_id: id, localizacion_espacial_id: id, catalogador_id: id, fecha_ingreso: date, estado_catalogacion_id: id, estado_revision_id: id, revisor_id: id, fecha_revision: date, observaciones: text(10000) }).strict(),
  placa: z.object({ codigo_ubicacion: text(), coleccion_id: id, codigo_placa: text(), clase_placa_id: id, etapa_uso_placa_id: id, diseno_placa_id: id, configuracion_cavidades_id: id, material_placa_id: id, color_placa_id: id, configuracion_rejilla_id: id, tipo_proteccion_id: id, sistema_ensamble_id: id, catalogador_id: id, fecha_ingreso: date, estado_catalogacion_id: id, revisor_id: id, fecha_revision: date, estado_revision_id: id, comentarios: text(10000), observaciones: text(10000) }).strict(),
  muestra: z.object({ coleccion_id: id, nombre_muestra_original: text(), codigo_muestra_sistema: text(), origen_muestra_id: id, metodo_adquisicion_id: id, catalogador_id: id, fecha_ingreso: date, revisor_id: id, fecha_revision: date, estado_catalogacion_id: id, observaciones: text(10000) }).strict(),
  dic_uni_lito_reportada: z.object({ codigo_uni_lito_reportada: text(), nombre_reportado: text(), catalogador_id: id, fecha_ingreso: date, revisor_id: id, fecha_revision: date, estado_revision_id: id, observaciones: text(10000) }).strict(),
  dic_uni_lito_normalizada: z.object({ cod_uni_lito_normalizada: text(), nombre_normalizado: text(), rango_lito_id: id, referencia_bibliografica_id: id, observaciones: text(10000), revisor_id: id, estado_revision_id: id, fecha_revision: date }).strict(),
  dic_uni_lito_actualizada: z.object({ cod_uni_lito_actualizada: text(), nombre_oficial: text(), rango_lito_id: id, estado_nomenclatura_id: id, revisor_id: id, fecha_revision: date, estado_revision_id: id, observaciones: text(10000) }).strict(),
  dic_biozona_reportada: z.object({ nombre_reportado: text(), autor_biozona_reportada: text(), codigo_biozona: text(), estado_revision_id: id, catalogador_id: id, fecha_ingreso: date, revisor_id: id, fecha_revision: date, observaciones: text(10000) }).strict(),
  dic_biozona_normalizada: z.object({ nombre_normalizado: text(), codigo_biozona: text(), autor_biozona_normalizada: text(), estado_revision_id: id, revisor_id: id, fecha_revision: date, observaciones: text(10000) }).strict(),
  dic_biozona_actualizada: z.object({ nombre_actualizado: text(), codigo_biozona_actual: text(), fuente_actualizacion: text(), fecha_actualizacion: date, revisor_id: id, fecha_revision: date, estado_revision_id: id, observaciones: text(10000) }).strict(),
  dic_edad_reportada: z.object({ nombre_reportado: text(), estado_revision_id: id, catalogador_id: id, fecha_ingreso: date, revisor_id: id, fecha_revision: date, observaciones: text(10000) }).strict(),
  dic_edad_normalizada: z.object({ nombre_normalizado: text(), rango_cronoestratigrafico_id: id, estado_revision_id: id, revisor_id: id, fecha_revision: date, observaciones: text(10000) }).strict(),
  dic_edad_actualizada: z.object({ nombre_actualizado: text(), escala_tiempo: text(), fuente_actualizacion: text(), revisor_id: id, fecha_revision: date, estado_revision_id: id, observaciones: text(10000) }).strict(),
} as const

export const IMPORT_MAX_ROWS = 1000
export const IMPORT_MAX_BYTES = 1_000_000
export const importTableSchema = z.enum(['coleccion', 'pozo', 'placa', 'muestra', 'dic_uni_lito_reportada', 'dic_uni_lito_normalizada', 'dic_uni_lito_actualizada', 'dic_biozona_reportada', 'dic_biozona_normalizada', 'dic_biozona_actualizada', 'dic_edad_reportada', 'dic_edad_normalizada', 'dic_edad_actualizada'])
const importRowSchema = z.record(z.unknown()).superRefine((row, context) => {
  if (!Object.values(row).some((value) => value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== ''))) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Import rows must contain at least one value' })
})
const importBatchSchema = z.object({ table: importTableSchema, rows: z.array(importRowSchema).min(1).max(IMPORT_MAX_ROWS) }).strict()
export const importBodySchema = z.object({ batches: z.array(importBatchSchema).min(1) }).strict().superRefine((body, context) => {
  const totalRows = body.batches.reduce((total, batch) => total + batch.rows.length, 0)
  if (totalRows > IMPORT_MAX_ROWS) context.addIssue({ code: z.ZodIssueCode.too_big, maximum: IMPORT_MAX_ROWS, type: 'array', inclusive: true, message: `Import batches cannot exceed ${IMPORT_MAX_ROWS} rows` })
})

export function validateImportRows(table: ImportTable, rows: ImportRow[]) { return rows.map((row) => schemas[table].parse(row)) }

export const importColumns: Record<ImportTable, readonly string[]> = {
  coleccion: ['codigo_coleccion', 'nombre_coleccion', 'institucion', 'responsable_coleccion', 'descripcion', 'estado_coleccion'],
  pozo: ['codigo_pozo', 'nombre_pozo', 'cuenca_id', 'localizacion_geografica_id', 'localizacion_espacial_id', 'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id', 'estado_revision_id', 'revisor_id', 'fecha_revision', 'observaciones'],
  placa: ['codigo_ubicacion', 'coleccion_id', 'codigo_placa', 'clase_placa_id', 'etapa_uso_placa_id', 'diseno_placa_id', 'configuracion_cavidades_id', 'material_placa_id', 'color_placa_id', 'configuracion_rejilla_id', 'tipo_proteccion_id', 'sistema_ensamble_id', 'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id', 'revisor_id', 'fecha_revision', 'estado_revision_id', 'comentarios', 'observaciones'],
  muestra: ['coleccion_id', 'nombre_muestra_original', 'codigo_muestra_sistema', 'origen_muestra_id', 'metodo_adquisicion_id', 'catalogador_id', 'fecha_ingreso', 'revisor_id', 'fecha_revision', 'estado_catalogacion_id', 'observaciones'],
  dic_uni_lito_reportada: ['codigo_uni_lito_reportada', 'nombre_reportado', 'catalogador_id', 'fecha_ingreso', 'revisor_id', 'fecha_revision', 'estado_revision_id', 'observaciones'],
  dic_uni_lito_normalizada: ['cod_uni_lito_normalizada', 'nombre_normalizado', 'rango_lito_id', 'referencia_bibliografica_id', 'observaciones', 'revisor_id', 'estado_revision_id', 'fecha_revision'],
  dic_uni_lito_actualizada: ['cod_uni_lito_actualizada', 'nombre_oficial', 'rango_lito_id', 'estado_nomenclatura_id', 'revisor_id', 'fecha_revision', 'estado_revision_id', 'observaciones'],
  dic_biozona_reportada: ['nombre_reportado', 'autor_biozona_reportada', 'codigo_biozona', 'estado_revision_id', 'catalogador_id', 'fecha_ingreso', 'revisor_id', 'fecha_revision', 'observaciones'],
  dic_biozona_normalizada: ['nombre_normalizado', 'codigo_biozona', 'autor_biozona_normalizada', 'estado_revision_id', 'revisor_id', 'fecha_revision', 'observaciones'],
  dic_biozona_actualizada: ['nombre_actualizado', 'codigo_biozona_actual', 'fuente_actualizacion', 'fecha_actualizacion', 'revisor_id', 'fecha_revision', 'estado_revision_id', 'observaciones'],
  dic_edad_reportada: ['nombre_reportado', 'estado_revision_id', 'catalogador_id', 'fecha_ingreso', 'revisor_id', 'fecha_revision', 'observaciones'],
  dic_edad_normalizada: ['nombre_normalizado', 'rango_cronoestratigrafico_id', 'estado_revision_id', 'revisor_id', 'fecha_revision', 'observaciones'],
  dic_edad_actualizada: ['nombre_actualizado', 'escala_tiempo', 'fuente_actualizacion', 'revisor_id', 'fecha_revision', 'estado_revision_id', 'observaciones'],
}
