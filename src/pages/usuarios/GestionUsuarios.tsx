import React, { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import PersonaForm from '../../pages/catalogos/PersonaForm'

export default function GestionUsuarios() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: personas, isLoading, error, refetch } = useQuery({
    queryKey: ['personas-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('persona').select('*').order('rol', { ascending: true })
      if (error) throw error
      return data || []
    }
  })

  const updateUser = useMutation({
    mutationFn: async (payload: any) => {
      const { persona_id, ...updateData } = payload
      console.log('updateUser.mutationFn payload', { persona_id, updateData })
      // Only allow these fields to be updated
      const allowed = ['nombre', 'rol', 'email', 'activo']
      const sanitized: Record<string, any> = {}
      Object.entries(updateData).forEach(([k, v]) => {
        if (allowed.includes(k)) sanitized[k] = v
      })
      // If nothing to update, throw
      if (!Object.keys(sanitized).length) throw new Error('No valid fields to update')

      // Perform update and return updated rows
      const { data, error } = await supabase.from('persona').update(sanitized).eq('persona_id', persona_id).select()
      console.log('updateUser.mutationFn response', { data, error })
      if (error) throw error
      if (!data || data.length === 0) throw new Error('No rows were updated')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personas-all'] }),
    onError: (err: any) => {
      console.error('updateUser error', err)
      alert('Error actualizando usuario: ' + err.message)
    }
  })

  const handleToggleActive = async (persona: any) => {
    try {
      await updateUser.mutateAsync({
        persona_id: persona.persona_id,
        activo: !persona.activo
      })
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  const handleChangeRole = async (personaId: string, newRole: string) => {
    try {
      await updateUser.mutateAsync({ persona_id: personaId, rol: newRole })
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  const sendMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
      alert('Link enviado a ' + email)
    } catch (e: any) {
      alert('Error enviando link: ' + e.message)
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
        <Button onClick={() => alert('Formulario de nuevo usuario pendiente')}>
          Nuevo Usuario
        </Button>
      </div>

      {isLoading ? (
        <p>Cargando usuarios...</p>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">Error cargando usuarios: {(error as Error).message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : !personas?.length ? (
        <p className="text-gray-500">No hay usuarios registrados.</p>
      ) : (
        <div className="bg-white border rounded p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personas.map(p => (
                <TableRow key={p.persona_id}>
                  <TableCell>{p.persona_id}</TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    <Select
                      value={p.rol}
                      onValueChange={(value) => handleChangeRole(p.persona_id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Catalogador">Catalogador</SelectItem>
                        <SelectItem value="Revisor">Revisor</SelectItem>
                        <SelectItem value="Curador">Curador</SelectItem>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className={p.activo ? 'text-green-600' : 'text-red-600'}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(p); setShowForm(true) }}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(p)}>
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                    {!p.activo && (
                      <Button size="sm" onClick={() => sendMagicLink(p.email)}>
                        Enviar Link
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
  <div className="bg-gray-100 p-6 rounded w-1/3 max-h-[80vh] overflow-y-auto">
    <h3 className="text-lg font-semibold mb-4">Editar Usuario</h3>
      <PersonaForm
        defaultValues={editing}
        onSubmit={async (v) => {
          try {
            // prefer persona_id from form (in case editing state is stale)
            const personaId = (v?.persona_id || editing?.persona_id || '').toString().trim()
            console.log('GestionUsuarios: enviando update', { persona_id_from_form: v?.persona_id, persona_id_from_editing: editing?.persona_id, personaId, payload: v })

            if (!personaId) {
              alert('ID de persona vacío. No se puede actualizar.')
              return
            }

            // Pre-check: verify the persona exists (helps diagnose mismatched IDs or RLS)
            try {
              // Log current auth user/session to help diagnose RLS issues
              try {
                const authUser = await supabase.auth.getUser()
                const authSession = await supabase.auth.getSession()
                console.log('supabase auth.getUser()', authUser)
                console.log('supabase auth.getSession()', authSession)
              } catch (authErr) {
                console.warn('Could not read supabase auth state', authErr)
              }
              const pre = await supabase.from('persona').select('persona_id, email').eq('persona_id', personaId).maybeSingle()
              console.log('pre-check persona', pre)
              if (!pre.data) {
                alert('No se encontró la persona con persona_id=' + personaId)
                return
              }
            } catch (preErr: any) {
              console.warn('pre-check failed', preErr)
            }

            await updateUser.mutateAsync({ persona_id: personaId, ...v })
            setShowForm(false)
            setEditing(null)
          } catch (e: any) {
            alert('Error: ' + e.message)
          }
        }}
        onCancel={() => { setShowForm(false); setEditing(null) }}
      />
  </div>
</div>
      )}
    </AppLayout>
  )
}
