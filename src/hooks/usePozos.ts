import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../lib/api'
import { Pozo } from '../types/database'

const PAGE_SIZE = 20

export function usePozos(page = 0, search?: string) {
  return useQuery({
    queryKey: ['pozos', page, search],
    queryFn: async () => {
      return apiRequest<{ data: Pozo[]; total: number }>(`/api/wells?page=${page}&pageSize=${PAGE_SIZE}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
    }
  })
}

export function usePozo(id?: string) {
  return useQuery({
    queryKey: ['pozo', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null
      return apiRequest<Pozo>(`/api/wells/${encodeURIComponent(id)}`)
    }
  })
}
