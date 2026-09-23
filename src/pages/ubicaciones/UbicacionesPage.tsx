import React, { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useUbicaciones } from '../../hooks/useUbicaciones'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'

export default function UbicacionesPage() {
  const [search, setSearch] = useState('')
  const [occupied, setOccupied] = useState<boolean | undefined>()
  const { data: locations, isLoading } = useUbicaciones(0, { search, occupied })

  return (
    <AppLayout>
      <h2 className="text-xl font-semibold mb-6">Ubicaciones físicas</h2>
      <p className="text-sm text-muted-foreground mb-4">El esquema normalizado no relaciona directamente la ubicación con un mueble ni expone una columna de zona; esos campos no se muestran.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={occupied === undefined ? '' : String(occupied)}
          onChange={event => setOccupied(event.target.value === '' ? undefined : event.target.value === 'true')}
          className="border p-2 rounded"
        >
          <option value="">Todas</option>
          <option value="true">Con placa</option>
          <option value="false">Disponibles</option>
        </select>
        <Input placeholder="Buscar código, sección o columna..." value={search} onChange={event => setSearch(event.target.value)} />
      </div>
      <div className="bg-white border rounded p-4">
        {isLoading ? <p>Cargando...</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Código</TableHead><TableHead>Sección</TableHead><TableHead>Bandeja</TableHead>
              <TableHead>Columna</TableHead><TableHead>Posición</TableHead><TableHead>Estado</TableHead>
            </TableRow></TableHeader>
            <TableBody>{locations?.data.map(location => (
              <TableRow key={location.ubicacion_fisica_id}>
                <TableCell>{location.codigo_ubicacion || location.ubicacion_fisica_id}</TableCell>
                <TableCell>{location.seccion_nombre || location.seccion_codigo || '—'}</TableCell>
                <TableCell>{location.numero_bandeja ?? '—'}</TableCell>
                <TableCell>{location.columna_nombre || location.columna_codigo || '—'}</TableCell>
                <TableCell>{location.posicion_bandeja ?? '—'}</TableCell>
                <TableCell><Badge variant={location.placa_id ? 'default' : 'outline'}>{location.placa_id ? 'Con placa' : 'Disponible'}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </div>
    </AppLayout>
  )
}
