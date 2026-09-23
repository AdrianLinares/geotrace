import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { AdminApiError, listApplicationRoles, listManagedPeople, reconcileSessionAfterAdminMutation, updateManagedPerson } from '../../lib/adminApi'
import type { ManagedPerson } from '../../../server/types'

export default function GestionUsuarios() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<ManagedPerson | null>(null)
  const people = useQuery({ queryKey: ['admin-personas'], queryFn: listManagedPeople })
  const roles = useQuery({ queryKey: ['admin-roles'], queryFn: listApplicationRoles })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateManagedPerson>[1] }) => updateManagedPerson(id, input),
    onSuccess: async () => {
      await reconcileSessionAfterAdminMutation(navigate)
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-personas'] })
    },
  })

  const errorMessage = (error: unknown) => error instanceof AdminApiError ? error.message : 'No se pudo cargar la gestión de usuarios.'

  return <AppLayout>
    <h2 className="mb-6 text-xl font-semibold">Gestión de usuarios</h2>
    <p className="mb-4 text-sm text-gray-600">AD gestiona las contraseñas. Los cambios de rol se verifican al restaurar la sesión actual.</p>
    {(people.isError || roles.isError) && <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-red-700">{errorMessage(people.error ?? roles.error)}</div>}
    {update.isError && <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-red-700">{errorMessage(update.error)}</div>}
    {people.isLoading || roles.isLoading ? <p>Cargando usuarios...</p> : <div className="rounded border bg-white p-4">
      <Table><TableHeader><TableRow><TableHead>Persona</TableHead><TableHead>Correo</TableHead><TableHead>Roles activos</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
        <TableBody>{people.data?.data.map(person => <TableRow key={person.persona_id}>
          <TableCell>{person.nombre} {person.apellidos}</TableCell><TableCell>{person.correo}</TableCell>
          <TableCell>{person.roles.length ? person.roles.map(role => role.nombre).join(', ') : 'Sin asignación'}</TableCell>
          <TableCell><span className={person.activo ? 'text-green-600' : 'text-red-600'}>{person.activo ? 'Activo' : 'Inactivo'}</span></TableCell>
          <TableCell><Button variant="outline" size="sm" onClick={() => setEditing(person)}>Editar</Button></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>}
    {editing && <PersonEditor person={editing} roles={roles.data?.data ?? []} saving={update.isPending} onCancel={() => setEditing(null)} onSave={input => update.mutate({ id: editing.persona_id, input })} />}
  </AppLayout>
}

function PersonEditor({ person, roles, saving, onCancel, onSave }: { person: ManagedPerson; roles: Array<{ rol_id: string; nombre: string }>; saving: boolean; onCancel: () => void; onSave: (input: { nombre: string; apellidos: string; correo: string; activo: boolean; role_ids: string[] }) => void }) {
  const [nombre, setNombre] = useState(person.nombre)
  const [apellidos, setApellidos] = useState(person.apellidos)
  const [correo, setCorreo] = useState(person.correo)
  const [activo, setActivo] = useState(person.activo)
  const [selectedRoles, setSelectedRoles] = useState(person.roles.map(role => role.rol_id))
  const toggleRole = (id: string) => setSelectedRoles(current => current.includes(id) ? current.filter(roleId => roleId !== id) : [...current, id])
  return <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"><form className="w-full max-w-lg space-y-4 rounded bg-white p-6" onSubmit={event => { event.preventDefault(); onSave({ nombre, apellidos, correo, activo, role_ids: selectedRoles }) }}>
    <h3 className="text-lg font-semibold">Editar persona</h3><Input value={nombre} onChange={event => setNombre(event.target.value)} placeholder="Nombre" required /><Input value={apellidos} onChange={event => setApellidos(event.target.value)} placeholder="Apellidos" required /><Input type="email" value={correo} onChange={event => setCorreo(event.target.value)} placeholder="Correo" required />
    <label className="flex gap-2"><input type="checkbox" checked={activo} onChange={event => setActivo(event.target.checked)} /> Activo</label>
    <fieldset><legend className="mb-2 font-medium">Roles activos</legend>{roles.map(role => <label className="mr-4 inline-flex gap-2" key={role.rol_id}><input type="checkbox" checked={selectedRoles.includes(role.rol_id)} onChange={() => toggleRole(role.rol_id)} />{role.nombre}</label>)}</fieldset>
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={saving}>Guardar</Button></div>
  </form></div>
}
