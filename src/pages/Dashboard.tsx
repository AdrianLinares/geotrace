import React from 'react'
import AppLayout from '../components/layout/AppLayout'
import { useDashboardKPIs, useEstadoCatalogacionDist, useOcupacionMuebles, useActividadReciente, usePlacasProblemas } from '../hooks/useDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORES_ESTADO: Record<string, string> = {
  'Validado': '#28a745',
  'En revisión': '#ffc107',
  'En proceso': '#17a2b8',
  'Incompleto': '#dc3545',
  'Cerrado': '#6c757d',
}

export default function Dashboard() {
  const { data: kpis, isLoading: kpiLoading } = useDashboardKPIs()
  const { data: estadoDist, isLoading: estadoLoading } = useEstadoCatalogacionDist()
  const { data: ocupacion, isLoading: ocupLoading } = useOcupacionMuebles()
  const { data: actividad, isLoading: actLoading } = useActividadReciente()
  const { data: problemas, isLoading: probLoading } = usePlacasProblemas()

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard - Catálogo de Placas (SGC)</h1>
        <p className="text-sm text-muted-foreground">Resumen del estado de catalogación</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle>Total Placas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{kpiLoading ? '...' : kpis?.totalPlacas}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Muestras</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{kpiLoading ? '...' : kpis?.totalMuestras}</div></CardContent>
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

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

        <Card>
          <CardHeader><CardTitle>% Ocupación por Mueble</CardTitle></CardHeader>
          <CardContent>
            {ocupLoading ? <p>Cargando...</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ocupacion || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ocupacion" fill="#2D5016" name="% Ocupación" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Actividad Reciente</CardTitle></CardHeader>
        <CardContent>
          {actLoading ? <p>Cargando...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabla</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(actividad || []).slice(0, 20).map(a => (
                  <TableRow key={a.auditoria_id}>
                    <TableCell>{a.tabla}</TableCell>
                    <TableCell><Badge>{a.operacion}</Badge></TableCell>
                    <TableCell>{a.registro_id}</TableCell>
                    <TableCell>{a.created_at ? new Date(a.created_at as any).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Conservation Alerts */}
      <Card>
        <CardHeader><CardTitle>Alertas de Conservación</CardTitle></CardHeader>
        <CardContent>
          {probLoading ? <p>Cargando...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Vidrio</TableHead>
                  <TableHead>Hongos</TableHead>
                  <TableHead>Riesgo Contam.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(problemas || []).map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{p.placa_id}</TableCell>
                    <TableCell>
                      <Badge variant={p.nivel === 'CRÍTICA' ? 'destructive' : p.nivel === 'ATENCIÓN' ? 'secondary' : 'default'}>
                        {p.nivel}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.vidrio_estado}</TableCell>
                    <TableCell>{p.presencia_hongos ? 'Sí' : 'No'}</TableCell>
                    <TableCell>{p.riesgo_contaminacion ? 'Sí' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  )
}
