import React, { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { usePlacas, useCreatePlaca, useUpdatePlaca } from '../../hooks/usePlacas'
import { useColecciones } from '../../hooks/useColecciones'
import PlacaModal from './PlacaModal'
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
  const [modalOpen, setModalOpen] = useState(false)
  const [placaToEdit, setPlacaToEdit] = useState<Placa | null>(null)
  const [estadoModalOpen, setEstadoModalOpen] = useState(false)
  const [placaForEstado, setPlacaForEstado] = useState<Placa | null>(null)

  const { data, isLoading } = usePlacas(page, {
    coleccion_id: selectedColeccion,
    estado_catalogacion: selectedEstados,
    search,
  })
  const { data: colecciones } = useColecciones(0)
  const estados = ['En proceso', 'Incompleto', 'Completo', 'Pendiente información']

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
                    setSelectedEstados(prev => [...prev, est])
                  } else {
                    setSelectedEstados(selectedEstados.filter(e => e !== est))
                  }
                }}
              />
              {est}
            </label>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">El filtro de mueble no está disponible: UBICACION_FISICA se vincula con PLACA mediante el ID interno de la placa (<code>placa_id</code>), no mediante <code>codigo_placa</code>, y el esquema no expone una relación normalizada con MUEBLE.</p>
      </div>

      {/* Table */}
      <div className="bg-white border rounded p-4">
        {isLoading ? <p>Cargando...</p> : (
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Código de placa</TableHead>
                  <TableHead>Colección</TableHead>
                <TableHead>Código ubicación</TableHead>
                <TableHead>Clase</TableHead>
                <TableHead>Diseño</TableHead>
                <TableHead>Configuración cavidades</TableHead>
                <TableHead>Estado Cat.</TableHead>
                <TableHead>Muestras</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map(p => (
                <TableRow key={p.placa_id}>
                  <TableCell>{p.placa_id}</TableCell>
                  <TableCell>{p.codigo_placa ?? '—'}</TableCell>
                  <TableCell>{p.coleccion_nombre ?? p.coleccion_id ?? '—'}</TableCell>
                  <TableCell>{p.codigo_ubicacion ?? 'No disponible'}</TableCell>
                  <TableCell>{p.clase_placa}</TableCell>
                  <TableCell>{p.diseno_placa}</TableCell>
                  <TableCell>{p.total_cavidades ?? p.configuracion_cavidades_id ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      p.estado_catalogacion === 'Completo' ? 'default' :
                      p.estado_catalogacion === 'Pendiente información' ? 'secondary' :
                      p.estado_catalogacion === 'Incompleto' ? 'destructive' : 'outline'
                    }>
                      {p.estado_catalogacion ?? 'No disponible'}
                    </Badge>
                  </TableCell>
                  <TableCell title="MUESTRA no tiene una relación normalizada con PLACA">No disponible</TableCell>
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

    </AppLayout>
  )
}
