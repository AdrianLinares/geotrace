import { useQuery } from '@tanstack/react-query'
import { UbicacionFisica } from '../types/database'
import { apiRequest } from '../lib/api'

const PAGE_SIZE = 50

type UbicacionFilters = {
  search?: string
  occupied?: boolean
  sectionId?: string
}

/**
 * useUbicaciones
 * - Lectura paginada de la ubicación física normalizada mediante el API local.
 * - `occupied` se deriva de la relación normalizada `ubicacion_fisica.placa_id`.
 */
export function useUbicaciones(page = 0, filters?: UbicacionFilters) {
  return useQuery({
    queryKey: ['ubicaciones', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (filters?.search) params.set('search', filters.search)
      if (typeof filters?.occupied === 'boolean') params.set('occupied', String(filters.occupied))
      if (filters?.sectionId) params.set('sectionId', filters.sectionId)
      return apiRequest<{ data: UbicacionFisica[]; total: number }>(`/api/physical-locations?${params}`)
    }
  })
}

export function useUbicacion(id?: string) {
  return useQuery({
    queryKey: ['ubicacion', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null
      return apiRequest<UbicacionFisica>(`/api/physical-locations/${encodeURIComponent(id)}`)
    }
  })
}
