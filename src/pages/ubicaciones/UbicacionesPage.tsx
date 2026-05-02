import React, { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useUbicaciones } from '../../hooks/useUbicaciones'
import { useOcupacionMuebles } from '../../hooks/useDashboard' // reuse hook
import { usePlaca } from '../../hooks/usePlacas' // to fetch placa by id
import { supabase } from '../../lib/supabase' // for direct query
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import PlacaModal from '../placas/PlacaModal' // to open modal

export default function UbicacionesPage() {
  const [selectedMueble, setSelectedMueble] = useState<string>()
  const [ocupadaFilter, setOcupadaFilter] = useState<boolean | undefined>(undefined)

  // State for viewing placa from occupied ubicacion
  const [placaToView, setPlacaToView] = useState<any>(null)
  const [showPlacaModal, setShowPlacaModal] = useState(false)

  const { data: ubicaciones, isLoading } = useUbicaciones(0, {
    mueble_cod: selectedMueble,
    ocupada: ocupadaFilter,
  })
  const { data: ocupacion } = useOcupacionMuebles()

  const handleVerPlaca = (ubicacionId: string) => {
    // TODO: Implement logic to fetch placa by ubicacion_id and open modal
    throw new Error('handleVerPlaca not implemented')
  }

  // Get unique muebles
  const muebles = [...new Set(ubicaciones?.data?.map(u => u.mueble_cod).filter(Boolean))] as string[]

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Ubicaciones Físicas</h2>
      </div>

      {/* Visual panel: occupation per mueble */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {ocupacion?.map(m => (
          <div key={m.name} className="border rounded p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{m.name}</span>
              <span className="text-sm text-muted-foreground">{m.ocupacion}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-primary h-4 rounded-full"
                style={{ width: `${m.ocupacion}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {m.ocupadas} / {m.total} ubicaciones ocupadas
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={selectedMueble || ''}
          onChange={e => setSelectedMueble(e.target.value || undefined)}
          className="border p-2 rounded"
        >
          <option value="">Todos los muebles</option>
          {muebles.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={ocupadaFilter === undefined ? '' : ocupadaFilter ? 'true' : 'false'}
          onChange={e => {
            const v = e.target.value
            setOcupadaFilter(v === '' ? undefined : v === 'true')
          }}
          className="border p-2 rounded"
        >
          <option value="">Todas</option>
          <option value="true">Ocupadas</option>
          <option value="false">Disponibles</option>
        </select>

        <Input placeholder="Buscar ubicación..." />
      </div>

      {/* Table */}
      <div className="bg-white border rounded p-4">
        {isLoading ? <p>Cargando...</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Ubicación</TableHead>
                <TableHead>Mueble</TableHead>
                <TableHead>Sección</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Bandeja</TableHead>
                <TableHead>Posición</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ubicaciones?.data.map(u => (
                <TableRow key={u.ubicacion_id}>
                  <TableCell>{u.ubicacion_id}</TableCell>
                  <TableCell>{u.mueble_cod}</TableCell>
                  <TableCell>{u.seccion}</TableCell>
                  <TableCell>{u.zona}</TableCell>
                  <TableCell>{u.no_bandeja}</TableCell>
                  <TableCell>{u.posicion_placa}</TableCell>
                  <TableCell>
                    <Badge variant={u.ocupada ? 'default' : 'outline'}>
                      {u.ocupada ? 'Ocupada' : 'Disponible'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.ocupada && (
                      <Button variant="outline" size="sm" onClick={() => handleVerPlaca(u.ubicacion_id)}>
                        Ver placa
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Placa Modal for viewing from ubicacion */}
      {showPlacaModal && placaToView && (
        <PlacaModal
          isOpen={showPlacaModal}
          onClose={() => { setShowPlacaModal(false); setPlacaToView(null); }}
          placaToEdit={placaToView}
        />
      )}

    </AppLayout>
  )
}
