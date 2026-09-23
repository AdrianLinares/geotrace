import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../lib/api'
import { DicCuenca } from '../types/database'

export function useCuencas() {
  return useQuery({
    queryKey: ['dic_cuenca'],
    queryFn: async () => {
      const { data } = await apiRequest<{ data: DicCuenca[] }>('/api/reference/basins')
      return data
    }
  })
}
