import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../lib/api'
import { CatalogReferences, DicCuenca } from '../types/database'

export function useCatalogos() {
  return useQuery({
    queryKey: ['reference-catalogs'],
    queryFn: async () => {
      const { data } = await apiRequest<{ data: CatalogReferences }>('/api/reference/catalogs')
      return data
    },
  })
}

export function useCuencas() {
  return useQuery({
    queryKey: ['dic_cuenca'],
    queryFn: async () => {
      const { data } = await apiRequest<{ data: DicCuenca[] }>('/api/reference/basins')
      return data
    }
  })
}
