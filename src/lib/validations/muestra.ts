import { z } from 'zod'

/**
 * Esquema Zod para `muestra`
 * - Utilizado por los formularios del frontend para validar entradas.
 * - Validaciones complejas (p. ej. `profundidad_tope < profundidad_base`) deben
 *   implementarse con `refine` y documentarse aquí para que los tests los cubran.
 * - Asegúrate de mantener los mensajes de error claros y traducidos.
 */
export const muestraSchema = z.object({
  muestra_id: z.string().optional(),
  nombre_muestra_original: z.string().max(255).nullable().optional(),
  codigo_muestra_sistema: z.string().max(255).nullable().optional(),
  origen_muestra_id: z.string().nullable().optional(),
  metodo_adquisicion_id: z.string().nullable().optional(),
  fecha_ingreso: z.string().datetime({ offset: true }).nullable().optional(),
  revisor_id: z.string().nullable().optional(),
  fecha_revision: z.string().datetime({ offset: true }).nullable().optional(),
  estado_catalogacion_id: z.string().nullable().optional(),
  observaciones: z.string().max(10000).nullable().optional(),
  // Legacy form-only fields remain typed for the unmounted tab components.
  // MuestraModal intentionally does not render or submit them.
  procedencia_muestra: z.enum(['Superficie', 'Pozo']).optional(),
  nombre_pozo: z.string().optional(),
  tipo_muestra: z.string().optional(),
  tipo_profundidad: z.enum(['Intervalo', 'Puntual']).optional(),
  profundidad_puntual: z.number().min(0).optional(),
  profundidad_tope: z.number().min(0).optional(),
  profundidad_base: z.number().min(0).optional(),
  unidad_medida: z.enum(['pies (ft)', 'metros (m)']).optional(),
  cod_muestra: z.string().optional(),
  igm: z.string().optional(),
  no_preparacion: z.string().optional(),
  info_inferida: z.boolean().optional(),
  geologia: z.object({ unidad_lito: z.string().optional(), unidad_bio: z.string().optional(), edad: z.string().optional(), intervalo_muestreo: z.number().optional(), info_inferida: z.boolean().optional() }).optional(),
  microfauna: z.array(z.object({ genero_especie: z.string().min(1), abundancia: z.string().optional(), estado_preservacion: z.string().optional(), observaciones: z.string().optional() })).optional(),
  empresas: z.array(z.object({ empresa_id: z.string(), rol: z.string() })).optional(),
  disposicion: z.array(z.object({ tipo_cavidad: z.string().optional(), cod_cavidad: z.string().optional(), cavidad_nro: z.number().optional(), material_presente: z.boolean().optional(), material_estado: z.string().optional(), cantidad_cualitativa: z.string().optional() })).optional(),
  conservacion: z.object({ vidrio_estado_id: z.number().nullable().optional(), acetato_estado_id: z.number().nullable().optional(), marco_placa_estado_id: z.number().nullable().optional(), presencia_hongos: z.boolean().optional(), crecimiento_cristales: z.boolean().optional(), oxidacion: z.boolean().optional(), material_fuera_cavidad: z.boolean().optional(), riesgo_contaminacion: z.boolean().optional(), observaciones: z.string().optional() }).optional(),
})

export type MuestraForm = z.infer<typeof muestraSchema>
