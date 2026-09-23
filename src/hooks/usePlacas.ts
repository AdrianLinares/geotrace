import { useQuery } from '@tanstack/react-query'
import { Placa } from '../types/database'
import { apiRequest } from '../lib/api'
export { useCreatePlaca, useUpdatePlaca, useCambiarEstado } from './usePlacasLegacyMutations'

const PAGE_SIZE = 20

type PlacaFilters = {
  coleccion_id?: string
  estado_catalogacion?: string[]
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
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (filters?.coleccion_id) params.set('collectionId', filters.coleccion_id)
      if (filters?.estado_catalogacion?.length) params.set('states', filters.estado_catalogacion.join(','))
      if (filters?.search) params.set('search', filters.search)
      return apiRequest<{ data: Placa[]; total: number }>(`/api/plates?${params}`)
    }
  })
}

export function usePlaca(id?: string) {
  return useQuery({
    queryKey: ['placa', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null
      return apiRequest<Placa>(`/api/plates/${encodeURIComponent(id)}`)
    }
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
