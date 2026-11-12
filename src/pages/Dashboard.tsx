import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import AppLayout from '../components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useDashboardKPIs, useEstadoCatalogacionDist, usePlacasPorColeccion, type DashboardPlacasPorColeccion } from '../hooks/useDashboard'

const COLORES_ESTADO: Record<string, string> = {
  'Validado': '#28a745',
  'En revisión': '#ffc107',
  'En proceso': '#17a2b8',
  'Incompleto': '#dc3545',
  'Cerrado': '#6c757d',
}

export default function Dashboard() {
  // Dashboard compone varios widgets que consumen hooks específicos.
  // Fuentes de datos:
  // - KPIs: useDashboardKPIs()
  // - Distribución por estado: useEstadoCatalogacionDist()
  //
  // Cada hook devuelve { data, isLoading } siguiendo el patrón de React Query.
  const { data: kpis, isLoading: kpiLoading } = useDashboardKPIs()
  const { data: estadoDist, isLoading: estadoLoading } = useEstadoCatalogacionDist()
  const { data: placasPorColeccion, isLoading: placasPorColeccionLoading } = usePlacasPorColeccion()

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard - Catálogo de Placas (SGC)</h1>
        <p className="text-sm text-muted-foreground">Resumen del estado de catalogación</p>
      </div>

      {/* KPI Cards: representan métricas agregadas. Si `isLoading` mostramos `...` */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle>Total Placas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{kpiLoading ? '...' : kpis?.totalPlacas}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Muestras</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{kpiLoading ? '...' : kpis?.totalMuestras}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Colecciones</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{kpiLoading ? '...' : kpis?.totalColecciones}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Validadas (%)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{kpiLoading ? '...' : kpis?.placasValidadas + '%'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ubicaciones Disponibles</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{kpiLoading ? '...' : kpis?.ubicacionesDisponibles}</div></CardContent>
        </Card>
      </div>

      {/* Charts: usan Recharts. Los datos deben venir en formato [{ name, value }] o similar según hook. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Placas por colección</CardTitle></CardHeader>
          <CardContent>
            {placasPorColeccionLoading ? <p>Cargando...</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={placasPorColeccion || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {(placasPorColeccion || []).map((entry: DashboardPlacasPorColeccion, index: number) => (
                      <Cell key={index} fill={COLORES_ESTADO[entry.name] || ['#2D5016', '#6B8E23', '#A4C639', '#D9EAD3', '#8FBC8F'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribución por Estado</CardTitle></CardHeader>
          <CardContent>
            {estadoLoading ? <p>Cargando...</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={estadoDist || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {(estadoDist || []).map((entry, index) => (
                      <Cell key={index} fill={COLORES_ESTADO[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  )
}
