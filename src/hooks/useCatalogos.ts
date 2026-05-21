import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { DicCuenca, DicCampo, DicContrato, Empresa } from '../types/database'

export function useCuencas() {
  return useQuery({
    queryKey: ['dic_cuenca'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dic_cuenca').select('*').order('nombre_cuenca')
      if (error) throw error
      return (data as DicCuenca[]) ?? []
    }
  })
}

export function useCampos() {
  return useQuery({
    queryKey: ['dic_campo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dic_campo').select('*').order('nombre_campo')
      if (error) throw error
      return (data as DicCampo[]) ?? []
    }
  })
}

export function useContratos() {
  return useQuery({
    queryKey: ['dic_contrato'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dic_contrato').select('*').order('nombre_contrato')
      if (error) throw error
      return (data as DicContrato[]) ?? []
    }
  })
}

export function useEmpresas() {
  return useQuery({
    queryKey: ['empresa'],
    queryFn: async () => {
      const { data, error } = await supabase.from('empresa').select('*').order('nombre_empresa')
      if (error) throw error
      return (data as Empresa[]) ?? []
    }
  })
}
