import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../lib/api'

export type DashboardKpis = {
  totalPlacas: number
  totalMuestras: number
  placasValidadas: number
  ubicacionesDisponibles: number
}
export type DashboardEstado = { name: string; value: number }
export type DashboardOcupacion = { name: string; ocupacion: number; total: number; ocupadas: number }
export type DashboardActividad = {
  auditoria_id: string
  tabla: string
  operacion: 'INSERT' | 'UPDATE' | 'DELETE'
  registro_id: string
  created_at: string | null
}
export type PlacaProblema = {
  placa_id: string
  nivel: 'CRÍTICA' | 'ATENCIÓN' | 'LEVE'
  vidrio_estado: string | null
  presencia_hongos: boolean | null
  riesgo_contaminacion: boolean | null
}
export type DashboardData = {
  kpis: DashboardKpis
  estadoCatalogacion: DashboardEstado[]
  ocupacion: DashboardOcupacion[]
  actividadReciente: DashboardActividad[]
  problemasConservacion: PlacaProblema[]
}

const dashboardQuery = {
  queryKey: ['dashboard'],
  queryFn: () => apiRequest<DashboardData>('/api/dashboard'),
}

export function useDashboardKPIs() {
  return useQuery({ ...dashboardQuery, select: (dashboard: DashboardData) => dashboard.kpis })
}

export function useEstadoCatalogacionDist() {
  return useQuery({ ...dashboardQuery, select: (dashboard: DashboardData) => dashboard.estadoCatalogacion })
}

export function useOcupacionMuebles() {
  return useQuery({ ...dashboardQuery, select: (dashboard: DashboardData) => dashboard.ocupacion })
}

export function useActividadReciente() {
  return useQuery({ ...dashboardQuery, select: (dashboard: DashboardData) => dashboard.actividadReciente })
}

export function usePlacasProblemas() {
  return useQuery({ ...dashboardQuery, select: (dashboard: DashboardData) => dashboard.problemasConservacion })
}
