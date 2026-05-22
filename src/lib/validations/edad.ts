import { z } from 'zod'

/**
 * Esquemas para Edades
 * - `edadSchema` valida rangos y nombres de edades geológicas.
 * - Para validaciones de consistencia (base <= tope) añadir `refine()`.
 */
export const edadSchema = z.object({
  edad_id: z.string().min(1, 'Requerido'),
  nombre_edad: z.string().min(1, 'Requerido'),
  jerarquia: z.string().optional(),
  base_ma: z.preprocess(
    (val) => (Number.isNaN(val as number) ? undefined : val),
    z.number().min(0).optional()
  ),
  tope_ma: z.preprocess(
    (val) => (Number.isNaN(val as number) ? undefined : val),
    z.number().min(0).optional()
  ),
})

export type EdadForm = z.infer<typeof edadSchema>

export const sinonimoEdadSchema = z.object({
  sinonimo_edad_id: z.string().min(1, 'Requerido'),
  edad_id: z.string().min(1, 'Seleccione edad'),
  nombre_sinonimo: z.string().min(1, 'Requerido'),
  idioma: z.string().optional(),
})
