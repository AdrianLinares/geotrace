import { z } from 'zod'

export const edadSchema = z.object({
  edad_id: z.string().min(1, 'Requerido'),
  nombre_edad: z.string().min(1, 'Requerido'),
  jerarquia: z.string().optional(),
  base_ma: z.number().min(0).optional(),
  tope_ma: z.number().min(0).optional(),
})

export type EdadForm = z.infer<typeof edadSchema>

export const sinonimoEdadSchema = z.object({
  sinonimo_edad_id: z.string().min(1, 'Requerido'),
  edad_id: z.string().min(1, 'Seleccione edad'),
  nombre_sinonimo: z.string().min(1, 'Requerido'),
  idioma: z.string().optional(),
})
