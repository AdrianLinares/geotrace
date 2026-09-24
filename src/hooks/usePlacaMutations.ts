import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../lib/api'
import { Placa } from '../types/database'
import { PlacaForm } from '../lib/validations/placa'

type PlateInput = Omit<PlacaForm, 'placa_id' | 'marcado' | 'notas'>
const toPlateInput = (payload: PlacaForm): PlateInput => {
  const { placa_id: _id, marcado: _marcado, notas: _notas, estado_catalogacion_id: _state, ...plate } = payload
  return plate
}

export function useCreatePlaca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PlacaForm) => apiRequest<Placa>('/api/plates', { method: 'POST', body: JSON.stringify(toPlateInput(payload)) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['placas'] }),
  })
}

export function useUpdatePlaca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PlacaForm & { placa_id: string }) => apiRequest<Placa>(`/api/plates/${encodeURIComponent(payload.placa_id)}`, { method: 'PUT', body: JSON.stringify(toPlateInput(payload)) }),
    onSuccess: (_data, variables) => { qc.invalidateQueries({ queryKey: ['placas'] }); qc.invalidateQueries({ queryKey: ['placa', variables.placa_id] }) },
  })
}

export function useCambiarEstado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ placa_id, estado_catalogacion_id }: { placa_id: string; estado_catalogacion_id: string }) => apiRequest<Placa>(`/api/plates/${encodeURIComponent(placa_id)}/status`, { method: 'POST', body: JSON.stringify({ estado_catalogacion_id }) }),
    onSuccess: (_data, variables) => { qc.invalidateQueries({ queryKey: ['placas'] }); qc.invalidateQueries({ queryKey: ['placa', variables.placa_id] }) },
  })
}
