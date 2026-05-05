import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { Muestra } from '../types/database'

// Paginación por defecto para muestras
const PAGE_SIZE = 20

/**
 * useMuestras
 * - Lista muestras con paginación.
 * - Si `placaId` está presente, filtra por `placa_id`.
 * - `enabled` se usa para controlar ejecución; aquí está activada por defecto
 *   (se permite `page >= 0`) pero puedes deshabilitar si necesario.
 */
export function useMuestras(page = 0, placaId?: string) {
  return useQuery({
    queryKey: ['muestras', page, placaId],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase.from('muestra').select('*', { count: 'exact' }).range(from, to);
      if (placaId) query = query.eq('placa_id', placaId);
      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data as Muestra[]) ?? [], total: count };
    },
    enabled: typeof placaId !== 'undefined' || page >= 0,
  })
}

export function useMuestra(id?: string) {
  return useQuery({
    queryKey: ['muestra', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('muestra').select('*').eq('muestra_id', id).single();
      if (error) throw error;
      return data as Muestra;
    },
  })
}

export function useCreateMuestra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Muestra>) => {
      const { data, error } = await supabase.from('muestra').insert(payload).select().single();
      if (error) throw error;
      return data as Muestra;
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['muestras'] }) },
  })
}

export function useUpdateMuestra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Muestra> & { muestra_id: string }) => {
      const { data, error } = await supabase.from('muestra').update(payload).eq('muestra_id', payload.muestra_id).select().single();
      if (error) throw error;
      return data as Muestra;
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['muestras'] }) },
  })
}

export function useDeleteMuestra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { muestra_id: string }) => {
      const { error } = await supabase.from('muestra').delete().eq('muestra_id', payload.muestra_id)
      if (error) throw error
      return true
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['muestras'] }) },
  })
}
