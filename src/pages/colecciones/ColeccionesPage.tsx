import React, { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useColecciones, useCreateColeccion, useUpdateColeccion } from '../../hooks/useColecciones'
import ColeccionForm from './ColeccionForm'
import { Coleccion } from '../../types/database'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

export default function ColeccionesPage() {
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Coleccion | null>(null)
  const { data, isLoading } = useColecciones(page, q)
  const create = useCreateColeccion()
  const update = useUpdateColeccion()

  async function handleCreate(v: any) {
    try {
      await create.mutateAsync(v)
      setEditing(null)
    } catch (e) { console.error(e) }
  }

  async function handleUpdate(v: any) {
    try {
      if (!editing) return
      await update.mutateAsync({ ...v, coleccion_id: editing.coleccion_id })
      setEditing(null)
    } catch (e) { console.error(e) }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Colecciones</h2>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar" className="w-64" />
          <Button onClick={() => setEditing({} as any)}>Nueva</Button>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        {isLoading ? <div>Cargando...</div> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Institución</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map(c => (
                <TableRow key={c.coleccion_id}>
                  <TableCell>{c.coleccion_id}</TableCell>
                  <TableCell>{c.nombre_coleccion}</TableCell>
                  <TableCell>{c.institucion}</TableCell>
                  <TableCell>{c.estado_coleccion}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setEditing(c)}>Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={editing !== null} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{(editing as any)?.coleccion_id ? 'Editar colección' : 'Nueva colección'}</DialogTitle>
            <DialogDescription>
              Complete los campos y guarde.
            </DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <ColeccionForm
              defaultValues={editing as any}
              onCancel={() => setEditing(null)}
              onSubmit={(v) => ((editing as any)?.coleccion_id ? handleUpdate(v) : handleCreate(v))}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
