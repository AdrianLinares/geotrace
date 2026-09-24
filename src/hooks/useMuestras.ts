import { useQuery } from '@tanstack/react-query'
import { Muestra } from '../types/database'
import { apiRequest } from '../lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type SampleMutation = Partial<Pick<Muestra, 'nombre_muestra_original' | 'codigo_muestra_sistema' | 'origen_muestra_id' | 'metodo_adquisicion_id' | 'catalogador_id' | 'fecha_ingreso' | 'revisor_id' | 'fecha_revision' | 'estado_catalogacion_id' | 'observaciones'>>

export function useCreateMuestra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SampleMutation) => apiRequest<Muestra>('/api/samples', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['muestras'] }),
  })
}

export function useUpdateMuestra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ muestra_id, ...payload }: SampleMutation & { muestra_id: string }) => apiRequest<Muestra>(`/api/samples/${encodeURIComponent(muestra_id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['muestras'] })
      qc.invalidateQueries({ queryKey: ['muestra', variables.muestra_id] })
    },
  })
}

export function useDeleteMuestra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ muestra_id }: { muestra_id: string }) => apiRequest<{ ok: true }>(`/api/samples/${encodeURIComponent(muestra_id)}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['muestras'] }),
  })
}

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
