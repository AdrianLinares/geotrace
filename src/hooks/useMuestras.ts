import { useQuery } from '@tanstack/react-query'
import { Muestra } from '../types/database'
import { apiRequest } from '../lib/api'
export { useCreateMuestra, useUpdateMuestra, useDeleteMuestra } from './useMuestrasLegacyMutations'

const PAGE_SIZE = 20
export const MUESTRAS_PLACA_LIMITATION = 'MUESTRA no tiene una relación normalizada con PLACA.'

/**
 * useMuestras
 * - Lista muestras con paginación.
 * - El esquema normalizado no relaciona MUESTRA con PLACA.
 * - Con `placaId`, no consulta ni envía el campo legacy `placa_id`.
 */
export function useMuestras(page = 0, placaId?: string) {
  const query = useQuery({
    queryKey: ['muestras', page, placaId],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      return apiRequest<{ data: Muestra[]; total: number }>(`/api/samples?${params}`)
    },
    enabled: !placaId && page >= 0,
  })
  return { ...query, isPlateFilterUnsupported: Boolean(placaId) }
}

export function useMuestra(id?: string) {
  return useQuery({
    queryKey: ['muestra', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      return apiRequest<Muestra>(`/api/samples/${encodeURIComponent(id)}`)
    },
  })
}
