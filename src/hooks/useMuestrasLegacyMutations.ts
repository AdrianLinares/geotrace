import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { Muestra } from '../types/database'

// Temporary isolation boundary: writes remain on their existing Supabase path.
export function useCreateMuestra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Muestra>) => {
      const { data, error } = await supabase.from('muestra').insert(payload).select().single()
      if (error) throw error
      return data as Muestra
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['muestras'] }) },
  })
}

export function useUpdateMuestra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Muestra> & { muestra_id: string }) => {
      const { data, error } = await supabase.from('muestra').update(payload).eq('muestra_id', payload.muestra_id).select().single()
      if (error) throw error
      return data as Muestra
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['muestras'] }) },
  })
}

export function useDeleteMuestra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ muestra_id }: { muestra_id: string }) => {
      const { error } = await supabase.from('muestra').delete().eq('muestra_id', muestra_id)
      if (error) throw error
      return true
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['muestras'] }) },
  })
}
