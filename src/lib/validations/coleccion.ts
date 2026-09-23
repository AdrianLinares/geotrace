import { z } from 'zod'

/**
 * Esquema para colecciones
 * - Validación simple para crear/editar colecciones.
 * - `estado_coleccion` tiene valores permitidos; si se añaden nuevos estados,
 *   actualizar tanto el esquema como la lógica de UI que los consume.
 */
export const coleccionSchema = z.object({
  coleccion_id: z.string().optional(),
  codigo_coleccion: z.string().nullable().optional(),
  nombre_coleccion: z.string().min(3, 'Nombre demasiado corto'),
  institucion: z.string().nullable().optional(),
  responsable_coleccion: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  estado_coleccion: z.string().nullable().default('Activa')
})

export type ColeccionForm = z.infer<typeof coleccionSchema>
