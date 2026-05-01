import { z } from 'zod'

export const coleccionSchema = z.object({
  coleccion_id: z.string().optional(),
  nombre_coleccion: z.string().min(3, 'Nombre demasiado corto'),
  institucion: z.string().nullable().optional(),
  responsable: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  estado_coleccion: z.enum(['Activa', 'Cerrada']).default('Activa')
})

export type ColeccionForm = z.infer<typeof coleccionSchema>
