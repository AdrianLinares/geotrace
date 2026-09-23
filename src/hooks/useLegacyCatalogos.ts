import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { DicCampo, DicContrato, Empresa } from '../types/database'

// Legacy-only catalogs are intentionally isolated: sql/schema.sql has no CAT_* equivalent for them.
export function useLegacyCampo() { return useQuery({ queryKey: ['dic_campo'], queryFn: async () => { const { data, error } = await supabase.from('dic_campo').select('*').order('nombre_campo'); if (error) throw error; return (data as DicCampo[]) ?? [] } }) }
export function useLegacyContrato() { return useQuery({ queryKey: ['dic_contrato'], queryFn: async () => { const { data, error } = await supabase.from('dic_contrato').select('*').order('nombre_contrato'); if (error) throw error; return (data as DicContrato[]) ?? [] } }) }
export function useLegacyEmpresa() { return useQuery({ queryKey: ['empresa'], queryFn: async () => { const { data, error } = await supabase.from('empresa').select('*').order('nombre_empresa'); if (error) throw error; return (data as Empresa[]) ?? [] } }) }
