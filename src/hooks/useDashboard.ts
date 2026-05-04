import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { AuditoriaCambio } from '../types/database'

/**
 * Hooks de dashboard
 * - Pequeños helpers que agregan lógica de agregación para las vistas
 * - Usan llamadas directas a Supabase; si los queries crecen, considerar mover
 *   lógica agregada al backend (views o RPC) para rendimiento.
 */

// KPIs
export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const [
        { count: totalPlacas },
        { count: totalMuestras },
        { count: validadas },
        { count: ubicacionesDisponibles }
      ] = await Promise.all([
        supabase.from('placa').select('*', { count: 'exact', head: true }),
        supabase.from('muestra').select('*', { count: 'exact', head: true }),
        supabase.from('placa').select('*', { count: 'exact', head: true }).eq('estado_catalogacion', 'Validado'),
        supabase.from('ubicacion_fisica').select('*', { count: 'exact', head: true }).eq('ocupada', false)
      ])

      const porcentajeValidadas = totalPlacas ? ((validadas || 0) / totalPlacas) * 100 : 0

      return {
        totalPlacas: totalPlacas || 0,
        totalMuestras: totalMuestras || 0,
        placasValidadas: Math.round(porcentajeValidadas),
        ubicacionesDisponibles: ubicacionesDisponibles || 0
      }
    }
  })
}

// Distribución por estado de catalogación (para gráfico de dona)
export function useEstadoCatalogacionDist() {
  return useQuery({
    queryKey: ['dashboard-estado-dist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('placa')
        .select('estado_catalogacion')
        .not('estado_catalogacion', 'is', null)

      if (error) throw error

      const counts: Record<string, number> = {}
        ; (data as any[]).forEach(r => {
          const e = r.estado_catalogacion || 'Sin estado'
          counts[e] = (counts[e] || 0) + 1
        })

      return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }
  })
}

// % ocupación por mueble (para gráfico de barras)
export function useOcupacionMuebles() {
  return useQuery({
    queryKey: ['dashboard-ocupacion-muebles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ubicacion_fisica')
        .select('mueble_cod, ocupada')

      if (error) throw error

      const stats: Record<string, { total: number, ocupadas: number }> = {}
        ; (data as any[]).forEach(r => {
          const m = r.mueble_cod || 'Sin mueble'
          if (!stats[m]) stats[m] = { total: 0, ocupadas: 0 }
          stats[m].total++
          if (r.ocupada) stats[m].ocupadas++
        })

      return Object.entries(stats).map(([name, s]) => ({
        name,
        ocupacion: s.total ? Math.round((s.ocupadas / s.total) * 100) : 0,
        total: s.total,
        ocupadas: s.ocupadas
      }))
    }
  })
}

// Actividad reciente (auditoría)
export function useActividadReciente() {
  return useQuery({
    queryKey: ['dashboard-actividad'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auditoria_cambios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data || []) as AuditoriaCambio[]
    }
  })
}

// Placas con problemas de conservación (críticas / atención)
export function usePlacasProblemas() {
  return useQuery({
    queryKey: ['dashboard-placas-problemas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estado_conservacion')
        .select(`
          estado_cons_id,
          vidrio_estado,
          presencia_hongos,
          riesgo_contaminacion,
          oxidacion,
          crecimiento_cristales,
          material_fuera_cavidad,
          muestra:muestra_id (
            muestra_id,
            placa:placa_id (
              placa_id,
              estado_catalogacion
            )
          )
        `)
        .or('presencia_hongos.eq.true,riesgo_contaminacion.eq.true,vidrio_estado.eq.Roto,vidrio_estado.eq.Faltante,oxidacion.eq.true,crecimiento_cristales.eq.true,material_fuera_cavidad.eq.true')

      if (error) throw error

      const problemas = (data as any[]).map(r => {
        const critica = r.presencia_hongos || r.riesgo_contaminacion || r.vidrio_estado === 'Roto' || r.vidrio_estado === 'Faltante'
        const atencion = r.material_fuera_cavidad || r.oxidacion || r.crecimiento_cristales
        return {
          placa_id: r.muestra?.placa?.placa_id,
          nivel: critica ? 'CRÍTICA' : atencion ? 'ATENCIÓN' : 'LEVE',
          vidrio_estado: r.vidrio_estado,
          presencia_hongos: r.presencia_hongos,
          riesgo_contaminacion: r.riesgo_contaminacion
        }
      }).filter(p => p.placa_id)

      return problemas
    }
  })
}
