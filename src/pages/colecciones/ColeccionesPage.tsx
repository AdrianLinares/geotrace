import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { useColecciones, useCreateColeccion, useUpdateColeccion, useDeleteColeccion } from '../../hooks/useColecciones'
import { Coleccion } from '../../types/database'
import ColeccionForm from './ColeccionForm'
import type { ColeccionForm as ColeccionFormValues } from '../../lib/validations/coleccion'

/**
 * ColeccionesPage
 * - Página CRUD básica para colecciones.
 * - Usa `useColecciones` para obtener la lista (paginada) y mutaciones para crear/editar.
 * - El formulario usa `react-hook-form` + `zod` para validación (ver `ColeccionForm`).
 *
 * Puntos a revisar para un junior:
 * - La búsqueda (`q`) se pasa al hook para filtrar; la paginación básica está preparada.
 * - Manejo de errores: aquí sólo se hace `console.error`; en PRs futuros considera mostrar mensajes UI.
 */
export default function ColeccionesPage() {
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Coleccion | null>(null)
  const [deleting, setDeleting] = useState<Coleccion | null>(null)
  const { data, isLoading, isError } = useColecciones(page, q)
  const create = useCreateColeccion()
  const update = useUpdateColeccion()
  const del = useDeleteColeccion()

  async function handleCreate(v: ColeccionFormValues) {
    try {
      await create.mutateAsync(v)
      setEditing(null)
    } catch (e) { console.error(e) }
  }

  async function handleUpdate(v: ColeccionFormValues) {
    try {
      if (!editing) return
      await update.mutateAsync({ ...v, coleccion_id: editing.coleccion_id })
      setEditing(null)
    } catch (e) { console.error(e) }
  }

  async function handleDelete(coleccion_id: string) {
    try {
      await del.mutateAsync(coleccion_id)
      setDeleting(null)
    } catch (e) { console.error(e) }
  }

  const rows = data?.data ?? []
  const total = data?.total ?? 0
  const hasNextPage = (page + 1) * 20 < total

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Colecciones</h2>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={e => { setQ(e.target.value); setPage(0) }} placeholder="Buscar" className="w-64" />
          <Button onClick={() => setEditing({ coleccion_id: '', codigo_coleccion: null, nombre_coleccion: null, institucion: null, responsable_coleccion: null, descripcion: null, estado_coleccion: 'Activa' })}>Nueva</Button>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        {isLoading ? <div>Cargando...</div> : isError ? <div role="alert">No se pudieron cargar las colecciones.</div> : total === 0 ? <div className="py-8 text-center text-gray-500">No hay colecciones para mostrar.</div> : (
          <>
          {rows.length === 0 ? <div className="py-8 text-center text-gray-500">No hay colecciones en esta página.</div> : <Table>
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
              {rows.map(c => (
                <TableRow key={c.coleccion_id}>
                  <TableCell>{c.coleccion_id}</TableCell>
                  <TableCell>{c.nombre_coleccion ?? '-'}</TableCell>
                  <TableCell>{c.institucion ?? '-'}</TableCell>
                  <TableCell>{c.estado_coleccion ?? '-'}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(c)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleting(c)}>Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>{total} colecciones en total</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(current => current - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={!hasNextPage} onClick={() => setPage(current => current + 1)}>Siguiente</Button>
            </div>
          </div>
          </>
        )}
      </div>

      <Dialog open={editing !== null} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.coleccion_id ? 'Editar colección' : 'Nueva colección'}</DialogTitle>
            <DialogDescription>
              Complete los campos y guarde.
            </DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <ColeccionForm
              defaultValues={{ ...editing, nombre_coleccion: editing.nombre_coleccion ?? '', codigo_coleccion: editing.codigo_coleccion ?? '', institucion: editing.institucion ?? '', responsable_coleccion: editing.responsable_coleccion ?? '', descripcion: editing.descripcion ?? '', estado_coleccion: editing.estado_coleccion ?? 'Activa' }}
              onCancel={() => setEditing(null)}
              onSubmit={(v) => (editing.coleccion_id ? handleUpdate(v) : handleCreate(v))}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Eliminar la colección <strong>{deleting?.nombre_coleccion}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleting && handleDelete(deleting.coleccion_id)} disabled={del.isPending}>
              {del.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
