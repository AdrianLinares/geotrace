import React, { useMemo } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useColecciones } from '../../hooks/useColecciones'
import { usePlacas } from '../../hooks/usePlacas'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'

export default function InventarioColeccion() {
  const { data: colecciones } = useColecciones(0)
  const [selected, setSelected] = React.useState<string>()

  // Get placas for selected coleccion
  const { data: placas } = usePlacas(0, { coleccion_id: selected })

  // CSV export
  const exportCSV = () => {
    if (!placas?.data) return
    const headers = ['placa_id', 'ubicacion_id', 'estado_catalogacion', 'clase_placa', 'diseno_placa']
    const rows = placas.data.map(p => [
      p.placa_id,
      p.ubicacion_id,
      p.estado_catalogacion,
      p.clase_placa,
      p.diseno_placa
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventario_${selected || 'todas'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Inventario por Colección</h3>
        <p className="text-sm text-muted-foreground">Seleccione una colección para ver sus placas y exportar</p>
      </div>

      <select
        value={selected || ''}
        onChange={e => setSelected(e.target.value || undefined)}
        className="border p-2 rounded w-64 mb-4"
      >
        <option value="">Todas las colecciones</option>
        {colecciones?.data?.map(c => (
          <option key={c.coleccion_id} value={c.coleccion_id}>{c.nombre_coleccion}</option>
        ))}
      </select>

      <div className="bg-white border rounded p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa ID</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Clase</TableHead>
              <TableHead>Diseño</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {placas?.data?.map(p => (
              <TableRow key={p.placa_id}>
                <TableCell>{p.placa_id}</TableCell>
                <TableCell>{p.ubicacion_id}</TableCell>
                <TableCell>{p.estado_catalogacion}</TableCell>
                <TableCell>{p.clase_placa}</TableCell>
                <TableCell>{p.diseno_placa}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={exportCSV} disabled={!placas?.data?.length}>
          Exportar CSV
        </Button>
        <Button variant="outline" onClick={() => alert('PDF export not implemented yet')}>
          Exportar PDF
        </Button>
      </div>
    </AppLayout>
  )
}
