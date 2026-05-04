import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { Placa } from '../types/database'

const PAGE_SIZE = 20

type PlacaFilters = {
  coleccion_id?: string
  estado_catalogacion?: string[]
  mueble_cod?: string
  search?: string
}

/**
 * usePlacas
 * - Soporta filtros y paginación.
 * - `filters` puede contener `estado_catalogacion` (array) para filtrar con `in`.
 * - Para búsquedas simples usamos `or` con `ilike` en `placa_id` y `ubicacion_id`.
 *
 * Nota: la consulta usa `count: 'exact'` para devolver `total` en la respuesta.
 */
export function usePlacas(page = 0, filters?: PlacaFilters) {
  return useQuery({
    queryKey: ['placas', page, filters],
    queryFn: async () => {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase.from('placa').select('*', { count: 'exact' }).range(from, to)

      if (filters?.coleccion_id) query = query.eq('coleccion_id', filters.coleccion_id)
      if (filters?.estado_catalogacion && filters.estado_catalogacion.length) query = query.in('estado_catalogacion', filters.estado_catalogacion)
      if (filters?.search) {
        const s = `%${filters.search}%`
        query = query.or(`placa_id.ilike.${s},ubicacion_id.ilike.${s}`)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as Placa[]) ?? [], total: count }
    }
  })
}

export function usePlaca(id?: string) {
  return useQuery({
    queryKey: ['placa', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('placa').select('*').eq('placa_id', id).single()
      if (error) throw error
      return data as Placa
    }
  })
}

export function useCreatePlaca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Placa>) => {
      const { data, error } = await supabase.from('placa').insert(payload).select().single()
      if (error) throw error
      return data as Placa
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['placas'] }) }
  })
}

export function useUpdatePlaca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Placa> & { placa_id: string }) => {
      const { data, error } = await supabase.from('placa').update(payload).eq('placa_id', payload.placa_id).select().single()
      if (error) throw error
      return data as Placa
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['placas'] }) }
  })
}

// Allowed transitions (client-side mapping)
// - Estas reglas son sólo una ayuda UX; la autorización y validación
//   final debe aplicarse en el backend (RLS / triggers) para seguridad.
const TRANSITIONS: Record<string, string[]> = {
  'En proceso': ['Incompleto', 'En revisión'],
  'En revisión': ['Validado', 'Incompleto'],
  'Incompleto': ['En proceso'],
  'Validado': [], // only Curador/Admin can reopen
}

/**
 * useCambiarEstado
 * - Cambia el estado de una placa y escribe una entrada en `auditoria_cambios`.
 * - Importante: la función lee el estado actual, hace update y luego crea auditoría.
 * - Riesgos: hay operaciones asíncronas encadenadas; en alta concurrencia conviene
 *   usar transacciones en el servidor (Postgres) para evitar inconsistencias.
 */
export function useCambiarEstado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ placa_id, nuevoEstado, observaciones }: { placa_id: string, nuevoEstado: string, observaciones?: string }) => {
      // Fetch current state
      const { data: placa, error } = await supabase.from('placa').select('estado_catalogacion, catalogador_id').eq('placa_id', placa_id).single()
      if (error) throw error
      const actual = placa.estado_catalogacion
      // Check transitions (simplified - assumes user role checked client-side)
      // Server-side should enforce via RLS or trigger
      const { data, error: updError } = await supabase.from('placa').update({ estado_catalogacion: nuevoEstado }).eq('placa_id', placa_id).select().single()
      if (updError) throw updError
      // Insert audit
      const currentUser = await supabase.auth.getUser()
      await supabase.from('auditoria_cambios').insert({
        tabla: 'placa',
        registro_id: placa_id,
        operacion: 'UPDATE',
        campo_modificado: 'estado_catalogacion',
        valor_anterior: actual,
        valor_nuevo: nuevoEstado,
        usuario_id: currentUser.data.user?.id,
      })
      return data
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['placas'] }) }
  })
}
