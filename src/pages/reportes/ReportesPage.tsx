import React from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

const reports = [
  {
    title: 'Inventario por Colección',
    description: 'Tabla con selector de colección, exportable a CSV',
    path: '/reportes/inventario',
  },
  {
    title: 'Estado de Catalogación',
    description: 'Tabla resumen por colección con progreso',
    path: '/reportes/estado',
  },
  {
    title: 'Placas con Problemas',
    description: 'Placas con alertas de conservación, con nivel de prioridad',
    path: '/reportes/problemas',
  },
  {
    title: 'Microfauna por Pozo',
    description: 'Búsqueda por pozo, muestra tabla de especies encontradas',
    path: '/reportes/microfauna-pozo',
  },
  {
    title: 'Ocupación de Muebles',
    description: 'Barras de progreso + tabla detalle',
    path: '/reportes/ocupacion-muebles',
  },
]

export default function ReportesPage() {
  return (
    <AppLayout>
      <h2 className="text-xl font-semibold mb-6">Reportes</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((rep) => (
          <Card key={rep.path} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>{rep.title}</CardTitle>
              <CardDescription>{rep.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => (window.location.href = rep.path)}>
                Ver Reporte
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  )
}
