import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../lib/api'
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
      return apiRequest<{ data: Coleccion[]; total: number }>(`/api/collections?page=${page}&pageSize=${PAGE_SIZE}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
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
      return apiRequest<Coleccion>(`/api/collections/${encodeURIComponent(id)}`)
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
      return apiRequest<Coleccion>('/api/collections', { method: 'POST', body: JSON.stringify(payload) })
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['colecciones'] }) }
  })
}

export function useUpdateColeccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Coleccion> & { coleccion_id: string }) => {
      const { coleccion_id, ...rest } = payload
      return apiRequest<Coleccion>(`/api/collections/${encodeURIComponent(coleccion_id)}`, { method: 'PUT', body: JSON.stringify(rest) })
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['colecciones'] }) }
  })
}

export function useDeleteColeccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (coleccion_id: string) => {
      await apiRequest(`/api/collections/${encodeURIComponent(coleccion_id)}`, { method: 'DELETE' })
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['colecciones'] }) }
  })
}
