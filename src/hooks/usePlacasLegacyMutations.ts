import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { Placa } from '../types/database'

// Temporary isolation boundary: writes remain on their existing Supabase path.
export function useCreatePlaca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Placa>) => {
      const { data, error } = await supabase.from('placa').insert(payload).select().single()
      if (error) throw error
      return data as Placa
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['placas'] }) },
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
    onSuccess() { qc.invalidateQueries({ queryKey: ['placas'] }) },
  })
}

export function useCambiarEstado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ placa_id, nuevoEstado }: { placa_id: string; nuevoEstado: string; observaciones?: string }) => {
      const { data: placa, error } = await supabase.from('placa').select('estado_catalogacion, catalogador_id').eq('placa_id', placa_id).single()
      if (error) throw error
      const { data, error: updateError } = await supabase.from('placa').update({ estado_catalogacion: nuevoEstado }).eq('placa_id', placa_id).select().single()
      if (updateError) throw updateError
      const currentUser = await supabase.auth.getUser()
      await supabase.from('auditoria_cambios').insert({ tabla: 'placa', registro_id: placa_id, operacion: 'UPDATE', campo_modificado: 'estado_catalogacion', valor_anterior: placa.estado_catalogacion, valor_nuevo: nuevoEstado, usuario_id: currentUser.data.user?.id })
      return data
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['placas'] }) },
  })
}
