import { z } from 'zod'

export const biozonaSchema = z.object({
  biozona_id: z.string().min(1, 'Requerido'),
  nombre_biozona: z.string().min(1, 'Requerido'),
  grupo_fosil: z.string().optional(),
  edad_base: z.string().optional(),
  edad_tope: z.string().optional(),
})

export type BiozonaForm = z.infer<typeof biozonaSchema>

export const sinonimoBiozonaSchema = z.object({
  sinonimo_bio_id: z.string().min(1, 'Requerido'),
  biozona_id: z.string().min(1, 'Seleccione biozona'),
  nombre_sinonimo: z.string().min(1, 'Requerido'),
})
