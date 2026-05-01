import React, { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { supabase } from '../../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import UnidadLitoForm from './UnidadLitoForm'
import BiozonaForm from './BiozonaForm'
import EdadForm from './EdadForm'
import EmpresaForm from './EmpresaForm'
import PersonaForm from './PersonaForm'

export default function CatalogosPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('unidades')
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  // Fetch data
  const { data: unidades } = useQuery(['dic_unidad_lito'], async () => {
    const { data } = await supabase.from('dic_unidad_lito').select('*')
    return data || []
  })
  const { data: biozonas } = useQuery(['dic_biozona'], async () => {
    const { data } = await supabase.from('dic_biozona').select('*')
    return data || []
  })
  const { data: edades } = useQuery(['dic_edad'], async () => {
    const { data } = await supabase.from('dic_edad').select('*')
    return data || []
  })
  const { data: empresas } = useQuery(['empresa'], async () => {
    const { data } = await supabase.from('empresa').select('*')
    return data || []
  })
  const { data: personas } = useQuery(['persona'], async () => {
    const { data } = await supabase.from('persona').select('*')
    return data || []
  })

  // Generic delete mutation
  const deleteMutation = useMutation(async ({ table, idField, idValue }: { table: string, idField: string, idValue: string }) => {
    await supabase.from(table).delete().eq(idField, idValue)
    qc.invalidateQueries([table])
  })

  // Generic create/update helpers (simplified)
  const handleSave = async (table: string, values: any, idField: string) => {
    try {
      if (values[idField]) {
        await supabase.from(table).update(values).eq(idField, values[idField])
      } else {
        await supabase.from(table).insert(values)
      }
      qc.invalidateQueries([table])
      setShowForm(false)
      setEditing(null)
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  // Simple table renderer
  const renderTable = (headers: string[], rows: any[], idField: string, table: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map(h => <TableHead key={h}>{h}</TableHead>)}
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row: any) => (
          <TableRow key={row[idField]}>
            {headers.map(h => <TableCell key={h}>{row[h]}</TableCell>)}
            <TableCell className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => { setEditing(row); setShowForm(true) }}>Editar</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ table, idField, idValue: row[idField] })}>Eliminar</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <AppLayout>
      <h2 className="text-xl font-semibold mb-4">Catálogos Maestros</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="unidades">Unidades Litoestratigráficas</TabsTrigger>
          <TabsTrigger value="biozonas">Biozonas</TabsTrigger>
          <TabsTrigger value="edades">Edades Geológicas</TabsTrigger>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
        </TabsList>

        {['unidades', 'biozonas', 'edades', 'empresas', 'personas'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditing(null); setShowForm(true) }}>Nuevo</Button>
            </div>
            {tab === 'unidades' && renderTable(['unidad_lito_id', 'nombre_oficial', 'tipo_unidad', 'rango'], unidades || [], 'unidad_lito_id', 'dic_unidad_lito')}
            {tab === 'biozonas' && renderTable(['biozona_id', 'nombre_biozona', 'grupo_fosil', 'edad_base', 'edad_tope'], biozonas || [], 'biozona_id', 'dic_biozona')}
            {tab === 'edades' && renderTable(['edad_id', 'nombre_edad', 'jerarquia', 'base_ma', 'tope_ma'], edades || [], 'edad_id', 'dic_edad')}
            {tab === 'empresas' && renderTable(['empresa_id', 'nombre_empresa', 'tipo_empresa', 'pais'], empresas || [], 'empresa_id', 'empresa')}
            {tab === 'personas' && renderTable(['persona_id', 'nombre', 'rol', 'email', 'activo'], personas || [], 'persona_id', 'persona')}
          </TabsContent>
        ))}

      </Tabs>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-2/3 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar' : 'Nuevo'} - {activeTab}</h3>
            {activeTab === 'unidades' && (
              <UnidadLitoForm
                defaultValues={editing}
                onSubmit={(v) => handleSave('dic_unidad_lito', v, 'unidad_lito_id')}
                onCancel={() => { setShowForm(false); setEditing(null) }}
              />
            )}
            {activeTab === 'biozonas' && (
              <BiozonaForm
                defaultValues={editing}
                onSubmit={(v) => handleSave('dic_biozona', v, 'biozona_id')}
                onCancel={() => { setShowForm(false); setEditing(null) }}
              />
            )}
            {activeTab === 'edades' && (
              <EdadForm
                defaultValues={editing}
                onSubmit={(v) => handleSave('dic_edad', v, 'edad_id')}
                onCancel={() => { setShowForm(false); setEditing(null) }}
              />
            )}
            {activeTab === 'empresas' && (
              <EmpresaForm
                defaultValues={editing}
                onSubmit={(v) => handleSave('empresa', v, 'empresa_id')}
                onCancel={() => { setShowForm(false); setEditing(null) }}
              />
            )}
            {activeTab === 'personas' && (
              <PersonaForm
                defaultValues={editing}
                onSubmit={(v) => handleSave('persona', v, 'persona_id')}
                onCancel={() => { setShowForm(false); setEditing(null) }}
              />
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
