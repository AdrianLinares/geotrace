import { z } from 'zod'

/**
 * Esquema Zod para `placa`
 * - Usado por `react-hook-form` como `resolver` para validación declarativa.
 * - Mantener sincronía con la definición de la tabla en la base de datos
 *   (`sql/schema.sql`) y con `src/types/database.ts`.
 * - Para agregar reglas de validación complejas (p. ej. condicionales entre
 *   campos), preferir `refine()` en el esquema y centralizar los mensajes.
 */
export const placaSchema = z.object({
  placa_id: z.string().optional(),
  codigo_ubicacion: z.string().max(255).nullable().optional(),
  coleccion_id: z.string().regex(/^\d+$/).nullable().optional(),
  codigo_placa: z.string().max(255).nullable().optional(),
  clase_placa_id: z.string().regex(/^\d+$/).nullable().optional(),
  etapa_uso_placa_id: z.string().regex(/^\d+$/).nullable().optional(),
  diseno_placa_id: z.string().regex(/^\d+$/).nullable().optional(),
  configuracion_cavidades_id: z.string().regex(/^\d+$/).nullable().optional(),
  material_placa_id: z.string().regex(/^\d+$/).nullable().optional(),
  color_placa_id: z.string().regex(/^\d+$/).nullable().optional(),
  configuracion_rejilla_id: z.string().regex(/^\d+$/).nullable().optional(),
  tipo_proteccion_id: z.string().regex(/^\d+$/).nullable().optional(),
  sistema_ensamble_id: z.string().regex(/^\d+$/).nullable().optional(),
  fecha_ingreso: z.string().datetime({ offset: true }).nullable().optional(),
  estado_catalogacion_id: z.string().regex(/^\d+$/).nullable().optional(),
  revisor_id: z.string().regex(/^\d+$/).nullable().optional(),
  fecha_revision: z.string().datetime({ offset: true }).nullable().optional(),
  estado_revision_id: z.string().regex(/^\d+$/).nullable().optional(),
  comentarios: z.string().max(10000).nullable().optional(),
  observaciones: z.string().max(10000).nullable().optional(),
  marcado: z.object({
    tinta_negra: z.string().optional(),
    tinta_azul: z.string().optional(),
    tinta_roja: z.string().optional(),
    tinta_verde: z.string().optional(),
    lapiz: z.string().optional(),
    impresion_negro: z.string().optional(),
    impresion_azul: z.string().optional(),
    observaciones: z.string().optional(),
  }).optional(),
  notas: z.array(z.object({
    zona: z.enum(['Izquierda', 'Derecha', 'Arriba', 'Abajo']),
    clave_nota: z.string().optional(),
    texto_nota: z.string().optional(),
  })).optional(),
})

export type PlacaForm = z.infer<typeof placaSchema>
