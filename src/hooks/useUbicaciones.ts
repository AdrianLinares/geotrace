import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { UbicacionFisica, PaginatedResult } from '../types/database'

const PAGE_SIZE = 50

type UbicacionFilters = {
  mueble_cod?: string
  ocupada?: boolean
}

export function useUbicaciones(page = 0, filters?: UbicacionFilters) {
  return useQuery({
    queryKey: ['ubicaciones', page, filters],
    queryFn: async () => {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE -1
      let query = supabase.from('ubicacion_fisica').select('*', { count: 'exact' }).range(from, to)
      if (filters?.mueble_cod) query = query.eq('mueble_cod', filters.mueble_cod)
      if (typeof filters?.ocupada === 'boolean') query = query.eq('ocupada', filters.ocupada)
      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as UbicacionFisica[]) ?? [], total: count }
    }
  })
}

export function useUbicacion(id?: string) {
  return useQuery({
    queryKey: ['ubicacion', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('ubicacion_fisica').select('*').eq('ubicacion_id', id).single()
      if (error) throw error
      return data as UbicacionFisica
    }
  })
}

export function useUpdateUbicacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<UbicacionFisica> & { ubicacion_id: string }) => {
      const { data, error } = await supabase.from('ubicacion_fisica').update(payload).eq('ubicacion_id', payload.ubicacion_id).select().single()
      if (error) throw error
      return data as UbicacionFisica
    },
    onSuccess() { qc.invalidateQueries({ queryKey: ['ubicaciones'] }) }
  })
}
