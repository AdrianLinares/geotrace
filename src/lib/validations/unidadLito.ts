import { z } from 'zod'

// Sinónimo schema
export const sinonimoLitoSchema = z.object({
  sinonimo_lito_id: z.string().min(1, 'Requerido'),
  unidad_lito_id: z.string().optional(),
  nombre_sinonimo: z.string().min(1, 'Requerido'),
  idioma: z.string().optional(),
})

export const unidadLitoSchema = z.object({
  unidad_lito_id: z.string().min(1, 'Requerido'),
  nombre_oficial: z.string().min(1, 'Requerido'),
  tipo_unidad: z.string().optional(),
  rango: z.string().optional(),
  edad_base: z.string().optional(),
  edad_tope: z.string().optional(),
  sinonimos: z.array(sinonimoLitoSchema).optional(),
})

export type UnidadLitoForm = z.infer<typeof unidadLitoSchema>
