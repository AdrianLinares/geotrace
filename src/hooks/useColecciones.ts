import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { Coleccion, PaginatedResult } from '../types/database'

const PAGE_SIZE = 20

export function useColecciones(page = 0, search?: string) {
  return useQuery({
    queryKey: ['colecciones', page, search],
    queryFn: async () => {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE -1

      let query = supabase.from('coleccion').select('*', { count: 'exact' }).range(from, to)
      if (search) query = query.ilike('nombre_coleccion', `%${search}%`)

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as Coleccion[]) ?? [], total: count }
    }
  })
}

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
      const { data, error } = await supabase.from('coleccion').update(payload).eq('coleccion_id', payload.coleccion_id).select().single()
      if (error) throw error
      return data as Coleccion
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['colecciones'] }) }
  })
}
