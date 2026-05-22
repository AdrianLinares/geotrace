import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { Coleccion } from '../types/database'

// Paginación simple: número de registros por página (ajustable)
const PAGE_SIZE = 20

/**
 * useColecciones
 * - Devuelve páginas de colecciones con contador `total`.
 * - `queryKey` incluye `page` y `search` para caching/invalidación por combinación.
 * - Usa `ilike` para búsqueda case-insensitive en `nombre_coleccion`.
 *
 * Nota para juniors: React Query maneja la caché por `queryKey`. Si invalidas
 * `['colecciones']` en una mutación, todas las variaciones (distintas páginas)
 * se invalidarán y volverán a refetch — esto es aceptable aquí pero puede optimizarse.
 */
export function useColecciones(page = 0, search?: string) {
  return useQuery({
    queryKey: ['colecciones', page, search],
    queryFn: async () => {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase.from('coleccion').select('*', { count: 'exact' }).range(from, to)
      if (search) query = query.ilike('nombre_coleccion', `%${search}%`)

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as Coleccion[]) ?? [], total: count }
    }
  })
}

/**
 * useColeccion
 * - Obtiene una sola colección por `coleccion_id`.
 * - `enabled: !!id` evita ejecutar la query si `id` es falsy.
 */
export function useColeccion(id?: string) {
  return useQuery({
    queryKey: ['coleccion', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('coleccion').select('*').eq('coleccion_id', id).single()
      if (error) throw error
      return data as Coleccion
    }
  })
}

/**
 * Mutations: crear / actualizar colecciones
 * - Invalidan `['colecciones']` para forzar re-fetch.
 * - Consideración: si la app escala, usar invalidación más específica o actualizar la cache manualmente.
 */
export function useCreateColeccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Coleccion>) => {
      const { data, error } = await supabase.from('coleccion').insert(payload).select().single()
      if (error) throw error
      return data as Coleccion
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['colecciones'] }) }
  })
}

export function useUpdateColeccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Coleccion> & { coleccion_id: string }) => {
      const { coleccion_id, ...rest } = payload
      const { data, error } = await supabase.from('coleccion').update(rest).eq('coleccion_id', coleccion_id).select().single()
      if (error) throw error
      return data as Coleccion
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['colecciones'] }) }
  })
}

export function useDeleteColeccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (coleccion_id: string) => {
      const { error } = await supabase.from('coleccion').delete().eq('coleccion_id', coleccion_id)
      if (error) throw error
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['colecciones'] }) }
  })
}
