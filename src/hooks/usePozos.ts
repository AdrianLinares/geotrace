import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { Pozo } from '../types/database'

const PAGE_SIZE = 20

export function usePozos(page = 0, search?: string) {
  return useQuery({
    queryKey: ['pozos', page, search],
    queryFn: async () => {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      let query = supabase.from('pozo').select('*', { count: 'exact' }).range(from, to).order('well_name')
      if (search) query = query.ilike('well_name', `%${search}%`)
      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as Pozo[]) ?? [], total: count }
    }
  })
}

export function usePozo(id?: string) {
  return useQuery({
    queryKey: ['pozo', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('pozo').select('*').eq('pozo_id', id).single()
      if (error) throw error
      return data as Pozo
    }
  })
}
