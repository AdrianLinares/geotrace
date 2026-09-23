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

const paginationSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
}).strict()

export const collectionQuerySchema = paginationSchema
export const wellQuerySchema = paginationSchema
export const basinQuerySchema = z.object({}).strict()
export const plateQuerySchema = paginationSchema.extend({
  collectionId: normalizedIdSchema.optional(),
  states: z.preprocess(value => typeof value === 'string' ? value.split(',').filter(Boolean) : value, z.array(z.string().trim().min(1)).max(20).optional()),
}).strict()
export const sampleQuerySchema = paginationSchema.extend({ placaId: normalizedIdSchema.optional() }).strict()

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
