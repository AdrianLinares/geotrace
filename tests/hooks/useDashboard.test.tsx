import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDashboardKPIs, useOcupacionMuebles, usePlacasPorColeccion } from '../../src/hooks/useDashboard'
import { apiRequest } from '../../src/lib/api'

vi.mock('../../src/lib/api', () => ({ apiRequest: vi.fn() }))

const dashboard = {
  kpis: { totalPlacas: 2, totalMuestras: 3, totalColecciones: 5, placasValidadas: 50, ubicacionesDisponibles: 4 },
  estadoCatalogacion: [],
  placasPorColeccion: [{ name: 'Colección A', value: 3 }],
  ocupacion: [{ name: 'Sección A', ocupacion: 50, total: 2, ocupadas: 1 }],
  actividadReciente: [],
  problemasConservacion: [],
}

describe('useDashboard', () => {
  it('reads the aggregated dashboard endpoint and exposes typed slices', async () => {
    vi.mocked(apiRequest).mockResolvedValue(dashboard)
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    const kpis = renderHook(() => useDashboardKPIs(), { wrapper })
    const ocupacion = renderHook(() => useOcupacionMuebles(), { wrapper })
    const placasPorColeccion = renderHook(() => usePlacasPorColeccion(), { wrapper })

    await waitFor(() => expect(kpis.result.current.isSuccess).toBe(true))
    expect(kpis.result.current.data?.totalPlacas).toBe(2)
    expect(ocupacion.result.current.data?.[0].name).toBe('Sección A')
    expect(placasPorColeccion.result.current.data?.[0].name).toBe('Colección A')
    expect(apiRequest).toHaveBeenCalledWith('/api/dashboard')
  })
})
