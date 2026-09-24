import { z } from 'zod'

const optionalText = z.string().nullable().optional()

const collectionBodyFields = {
  codigo_coleccion: optionalText,
  nombre_coleccion: z.string().min(3).nullable().optional(),
  institucion: optionalText,
  responsable_coleccion: optionalText,
  descripcion: optionalText,
  estado_coleccion: optionalText,
} as const

export const collectionBodySchema = z.object(collectionBodyFields).strict().refine(
  input => Object.values(input).some(value => value !== undefined),
  'At least one collection field is required',
)

export const collectionCreateBodySchema = z.object({
  ...collectionBodyFields,
  nombre_coleccion: z.string().min(3),
}).strict()

export const collectionIdSchema = z.string().trim().min(1)
export const normalizedIdSchema = z.string().trim().regex(/^[1-9]\d*$/, 'Invalid identifier')

const personText = z.string().trim().min(1).max(255)
export const personIdSchema = normalizedIdSchema
export const personUpdateSchema = z.object({
  nombre: personText.optional(),
  apellidos: personText.optional(),
  correo: z.string().trim().email().max(255).optional(),
  activo: z.boolean().optional(),
  role_ids: z.array(normalizedIdSchema).max(20).refine(ids => new Set(ids).size === ids.length, 'Duplicate roles are not allowed').optional(),
}).strict().refine(input => Object.keys(input).length > 0, 'At least one person field is required')

const paginationSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
}).strict()

export const collectionQuerySchema = paginationSchema
export const wellQuerySchema = paginationSchema
export const basinQuerySchema = z.object({}).strict()
export const catalogReferenceQuerySchema = z.object({}).strict()
export const plateQuerySchema = paginationSchema.extend({
  collectionId: normalizedIdSchema.optional(),
  states: z.preprocess(value => typeof value === 'string' ? value.split(',').filter(Boolean) : value, z.array(z.string().trim().min(1)).max(20).optional()),
}).strict()
export const sampleQuerySchema = paginationSchema.extend({ placaId: normalizedIdSchema.optional() }).strict()
const optionalSampleId = z.preprocess(value => value === '' ? null : value, normalizedIdSchema.nullable().optional())
const optionalSampleText = z.string().max(255).nullable().optional()
const optionalSampleLongText = z.string().max(10000).nullable().optional()
export const sampleMutationSchema = z.object({
  nombre_muestra_original: optionalSampleText,
  codigo_muestra_sistema: optionalSampleText,
  origen_muestra_id: optionalSampleId,
  metodo_adquisicion_id: optionalSampleId,
  catalogador_id: optionalSampleId,
  fecha_ingreso: z.string().datetime({ offset: true }).nullable().optional(),
  revisor_id: optionalSampleId,
  fecha_revision: z.string().datetime({ offset: true }).nullable().optional(),
  estado_catalogacion_id: optionalSampleId,
  observaciones: optionalSampleLongText,
}).strict()
export const sampleCreateSchema = sampleMutationSchema.refine(input => Object.keys(input).length > 0, 'At least one sample field is required')
export const sampleUpdateSchema = sampleMutationSchema.refine(input => Object.keys(input).length > 0, 'At least one sample field is required')
const optionalBooleanQuery = z.preprocess(value => value === undefined || value === true || value === false ? value : value === 'true' ? true : value === 'false' ? false : value, z.boolean().optional())
export const physicalLocationQuerySchema = paginationSchema.extend({
  occupied: optionalBooleanQuery,
  sectionId: normalizedIdSchema.optional(),
}).strict()

const optionalPlateId = z.preprocess(value => value === '' ? null : value, normalizedIdSchema.nullable().optional())
const optionalPlateText = z.string().trim().max(255).nullable().optional()
const optionalPlateLongText = z.string().max(10000).nullable().optional()
export const plateMutationSchema = z.object({
  codigo_ubicacion: optionalPlateText,
  coleccion_id: optionalPlateId,
  codigo_placa: optionalPlateText,
  clase_placa_id: optionalPlateId,
  etapa_uso_placa_id: optionalPlateId,
  diseno_placa_id: optionalPlateId,
  configuracion_cavidades_id: optionalPlateId,
  material_placa_id: optionalPlateId,
  color_placa_id: optionalPlateId,
  configuracion_rejilla_id: optionalPlateId,
  tipo_proteccion_id: optionalPlateId,
  sistema_ensamble_id: optionalPlateId,
  catalogador_id: optionalPlateId,
  fecha_ingreso: z.string().datetime({ offset: true }).nullable().optional(),
  estado_catalogacion_id: optionalPlateId,
  revisor_id: optionalPlateId,
  fecha_revision: z.string().datetime({ offset: true }).nullable().optional(),
  estado_revision_id: optionalPlateId,
  comentarios: optionalPlateLongText,
  observaciones: optionalPlateLongText,
}).strict()

export const plateUpdateSchema = plateMutationSchema.refine(input => Object.keys(input).length > 0, 'At least one plate field is required')
export const plateCreateSchema = plateMutationSchema.refine(input => Object.keys(input).length > 0, 'At least one plate field is required')
export const plateTransitionSchema = z.object({ estado_catalogacion_id: normalizedIdSchema }).strict()

export function completeCollectionInput(input: z.infer<typeof collectionBodySchema>) {
  return {
    codigo_coleccion: input.codigo_coleccion ?? null,
    nombre_coleccion: input.nombre_coleccion ?? null,
    institucion: input.institucion ?? null,
    responsable_coleccion: input.responsable_coleccion ?? null,
    descripcion: input.descripcion ?? null,
    estado_coleccion: input.estado_coleccion ?? null,
  }
}
