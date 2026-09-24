import { z } from 'zod'
import type { ImportTable, ImportRow } from './types'

const id = z.coerce.number().int().positive().nullable().optional()
const text = (max = 255) => z.string().max(max).nullable().optional()
const date = z.string().datetime({ offset: true }).nullable().optional()

const schemas = {
  coleccion: z.object({
    codigo_coleccion: text(), nombre_coleccion: text(), institucion: text(),
    responsable_coleccion: text(), descripcion: text(10000), estado_coleccion: text(),
  }).strict(),
  pozo: z.object({
    codigo_pozo: text(), nombre_pozo: text(), cuenca_id: id, localizacion_geografica_id: id,
    localizacion_espacial_id: id, catalogador_id: id, fecha_ingreso: date,
    estado_catalogacion_id: id, estado_revision_id: id, revisor_id: id,
    observaciones: text(10000),
  }).strict(),
  placa: z.object({
    codigo_ubicacion: text(), coleccion_id: id, codigo_placa: text(), clase_placa_id: id,
    etapa_uso_placa_id: id, diseno_placa_id: id, configuracion_cavidades_id: id,
    material_placa_id: id, color_placa_id: id, configuracion_rejilla_id: id,
    tipo_proteccion_id: id, sistema_ensamble_id: id, catalogador_id: id, fecha_ingreso: date,
    estado_catalogacion_id: id, revisor_id: id,
    estado_revision_id: id, comentarios: text(10000), observaciones: text(10000),
  }).strict(),
  muestra: z.object({
    nombre_muestra_original: text(), codigo_muestra_sistema: text(), origen_muestra_id: id,
    metodo_adquisicion_id: id, catalogador_id: id, fecha_ingreso: date, revisor_id: id,
    estado_catalogacion_id: id, observaciones: text(10000),
  }).strict(),
} as const

export const IMPORT_MAX_ROWS = 1000
export const IMPORT_MAX_BYTES = 1_000_000
export const importTableSchema = z.enum(['coleccion', 'pozo', 'placa', 'muestra'])
const importRowSchema = z.record(z.unknown()).superRefine((row, context) => {
  const hasValue = Object.values(row).some((value) => value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== ''))
  if (!hasValue) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Import rows must contain at least one value' })
})
const importBatchSchema = z.object({
  table: importTableSchema,
  rows: z.array(importRowSchema).min(1).max(IMPORT_MAX_ROWS),
}).strict()
export const importBodySchema = z.object({ batches: z.array(importBatchSchema).min(1) }).strict().superRefine((body, context) => {
  const totalRows = body.batches.reduce((total, batch) => total + batch.rows.length, 0)
  if (totalRows > IMPORT_MAX_ROWS) context.addIssue({ code: z.ZodIssueCode.too_big, maximum: IMPORT_MAX_ROWS, type: 'array', inclusive: true, message: `Import batches cannot exceed ${IMPORT_MAX_ROWS} rows` })
})

export function validateImportRows(table: ImportTable, rows: ImportRow[]) {
  return rows.map((row) => schemas[table].parse(row))
}

export const importColumns: Record<ImportTable, readonly string[]> = {
  coleccion: ['codigo_coleccion', 'nombre_coleccion', 'institucion', 'responsable_coleccion', 'descripcion', 'estado_coleccion'],
  pozo: ['codigo_pozo', 'nombre_pozo', 'cuenca_id', 'localizacion_geografica_id', 'localizacion_espacial_id', 'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id', 'estado_revision_id', 'revisor_id', 'observaciones'],
  placa: ['codigo_ubicacion', 'coleccion_id', 'codigo_placa', 'clase_placa_id', 'etapa_uso_placa_id', 'diseno_placa_id', 'configuracion_cavidades_id', 'material_placa_id', 'color_placa_id', 'configuracion_rejilla_id', 'tipo_proteccion_id', 'sistema_ensamble_id', 'catalogador_id', 'fecha_ingreso', 'estado_catalogacion_id', 'revisor_id', 'estado_revision_id', 'comentarios', 'observaciones'],
  muestra: ['nombre_muestra_original', 'codigo_muestra_sistema', 'origen_muestra_id', 'metodo_adquisicion_id', 'catalogador_id', 'fecha_ingreso', 'revisor_id', 'estado_catalogacion_id', 'observaciones'],
}
