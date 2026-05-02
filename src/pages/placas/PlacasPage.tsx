import React, { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { usePlacas, useCreatePlaca, useUpdatePlaca } from '../../hooks/usePlacas'
import { useColecciones } from '../../hooks/useColecciones'
import { useUbicaciones } from '../../hooks/useUbicaciones'
import PlacaModal from './PlacaModal'
import MuestraModal from '@/pages/muestras/MuestraModal'
import { Placa } from '@/types/database'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import CambiarEstadoModal from './CambiarEstadoModal'

export default function PlacasPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedColeccion, setSelectedColeccion] = useState<string>()
  const [selectedEstados, setSelectedEstados] = useState<string[]>([])
  const [selectedMueble, setSelectedMueble] = useState<string>()
  const [modalOpen, setModalOpen] = useState(false)
  const [placaToEdit, setPlacaToEdit] = useState<Placa | null>(null)
  const [estadoModalOpen, setEstadoModalOpen] = useState(false)
  const [placaForEstado, setPlacaForEstado] = useState<Placa | null>(null)
  const [muestraModalOpen, setMuestraModalOpen] = useState(false)
  const [muestraToEdit, setMuestraToEdit] = useState<any>(null)
  const [placaForMuestra, setPlacaForMuestra] = useState<string | undefined>(undefined)

  const { data, isLoading } = usePlacas(page, {
    coleccion_id: selectedColeccion,
    estado_catalogacion: selectedEstados,
    mueble_cod: selectedMueble,
    search,
  })
  const { data: colecciones } = useColecciones(0)
  const { data: ubicaciones } = useUbicaciones(0)

  // Get unique muebles from ubicaciones
  const muebleSet = new Set(ubicaciones?.data?.map(u => u.mueble_cod).filter(Boolean))
  const muebles = Array.from(muebleSet) as string[]

  const estados = ['En proceso', 'Incompleto', 'En revisión', 'Validado', 'Cerrado']

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Placas</h2>
        <Button onClick={() => { setPlacaToEdit(null); setModalOpen(true) }}>Nueva Placa</Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Input
          placeholder="Buscar placa_id o ubicación..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={selectedColeccion || ''}
          onChange={e => setSelectedColeccion(e.target.value || undefined)}
          className="border p-2 rounded"
        >
          <option value="">Todas las colecciones</option>
          {colecciones?.data?.map(c => (
            <option key={c.coleccion_id} value={c.coleccion_id}>{c.nombre_coleccion}</option>
          ))}
        </select>

        <div className="border p-2 rounded space-y-1">
          {estados.map(est => (
            <label key={est} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedEstados.includes(est)}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedEstados([...selectedEstados, est])
                  } else {
                    setSelectedEstados(selectedEstados.filter(e => e !== est))
                  }
                }}
              />
              {est}
            </label>
          ))}
        </div>

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
      </div>

      {/* Table */}
      <div className="bg-white border rounded p-4">
        {isLoading ? <p>Cargando...</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Colección</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Clase</TableHead>
                <TableHead>Diseño</TableHead>
                <TableHead>Cavidades</TableHead>
                <TableHead>Estado Placa</TableHead>
                <TableHead>Estado Cat.</TableHead>
                <TableHead>Muestras</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map(p => (
                <TableRow key={p.placa_id}>
                  <TableCell>{p.placa_id}</TableCell>
                  <TableCell>{p.coleccion_id}</TableCell>
                  <TableCell>{p.ubicacion_id}</TableCell>
                  <TableCell>{p.clase_placa}</TableCell>
                  <TableCell>{p.diseno_placa}</TableCell>
                  <TableCell>{p.total_cavidades}</TableCell>
                  <TableCell>{p.estado_placa}</TableCell>
                  <TableCell>
                    <Badge variant={
                      p.estado_catalogacion === 'Validado' ? 'default' :
                      p.estado_catalogacion === 'En revisión' ? 'secondary' :
                      p.estado_catalogacion === 'Incompleto' ? 'destructive' : 'outline'
                    }>
                      {p.estado_catalogacion}
                    </Badge>
                  </TableCell>
                  <TableCell>?</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => { setPlacaToEdit(p as any); setModalOpen(true) }}>Editar</Button>
                    <Button variant="secondary" size="sm" onClick={() => { setPlacaForEstado(p as any); setEstadoModalOpen(true) }}>Cambiar Estado</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Placa Modal */}
      <PlacaModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setPlacaToEdit(null) }}
        placaToEdit={placaToEdit as any}
      />

      {/* Cambiar Estado Modal */}
      <CambiarEstadoModal
        isOpen={estadoModalOpen}
        onClose={() => setEstadoModalOpen(false)}
        placa={placaForEstado}
      />

      {/* Muestra Modal */}
      <MuestraModal
        isOpen={muestraModalOpen}
        onClose={() => { setMuestraModalOpen(false); setMuestraToEdit(null) }}
        muestraToEdit={muestraToEdit}
        placaId={placaForMuestra}
      />
    </AppLayout>
  )
}
