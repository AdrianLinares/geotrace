import { z } from 'zod'

export const placaSchema = z.object({
  placa_id: z.string().optional(),
  coleccion_id: z.string().min(1, 'Seleccione una colección'),
  ubicacion_id: z.string().min(1, 'Seleccione una ubicación'),
  clase_placa: z.enum(['Asociación', 'Tipo']).optional(),
  rol_placa: z.enum(['picking', 'organización', 'intención_organización', 'vacía_picking']).optional(),
  diseno_placa: z.string().optional(),
  total_cavidades: z.number().min(0).optional(),
  estado_placa: z.enum(['Con material', 'Vacía']).optional(),
  tipo_rejilla: z.string().optional(),
  cubierta: z.enum(['Vidrio', 'Acetato']).optional(),
  tipo_abrazadera: z.enum(['Aluminio', 'Cartón']).optional(),
  estado_catalogacion: z.enum(['En proceso','Incompleto','En revisión','Validado','Cerrado']).optional(),
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
    zona: z.enum(['Izquierda','Derecha','Arriba','Abajo']),
    clave_nota: z.string().optional(),
    texto_nota: z.string().optional(),
  })).optional(),
})

export type PlacaForm = z.infer<typeof placaSchema>
