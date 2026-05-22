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
import CuencaForm from './CuencaForm'
import CampoForm from './CampoForm'
import ContratoForm from './ContratoForm'
import { useCuencas, useCampos, useContratos } from '../../hooks/useCatalogos'

export default function CatalogosPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('unidades')
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  // Fetch data
  const { data: unidades } = useQuery({
    queryKey: ['dic_unidad_lito'],
    queryFn: async () => {
      const { data } = await supabase.from('dic_unidad_lito').select('*')
      return data || []
    }
  })
  const { data: biozonas } = useQuery({
    queryKey: ['dic_biozona'],
    queryFn: async () => {
      const { data } = await supabase.from('dic_biozona').select('*')
      return data || []
    }
  })
  const { data: edades } = useQuery({
    queryKey: ['dic_edad'],
    queryFn: async () => {
      const { data } = await supabase.from('dic_edad').select('*')
      return data || []
    }
  })
  const { data: empresas } = useQuery({
    queryKey: ['empresa'],
    queryFn: async () => {
      const { data } = await supabase.from('empresa').select('*')
      return data || []
    }
  })
  const { data: cuencas } = useCuencas()
  const { data: campos } = useCampos()
  const { data: contratos } = useContratos()
  const { data: personas } = useQuery({
    queryKey: ['persona'],
    queryFn: async () => {
      const { data } = await supabase.from('persona').select('*')
      return data || []
    }
  })
  // Generic delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ table, idField, idValue }: { table: string, idField: string, idValue: string }) => {
      await supabase.from(table).delete().eq(idField, idValue)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [variables.table] })
    }
  })

  // Generic create/update helpers
  const handleSave = async (table: string, values: any, idField: string) => {
    try {
      const { [idField]: id, ...payload } = values
      // Clean empty strings to null for Supabase compatibility
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).map(([key, val]) => [key, val === '' ? null : val])
      )
      if (id) {
        await supabase.from(table).update(cleanPayload).eq(idField, id)
      } else {
        await supabase.from(table).insert(cleanPayload)
      }
      qc.invalidateQueries({ queryKey: [table] })
      setShowForm(false)
      setEditing(null)
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  // Simple table renderer
  const renderTable = (columns: { key: string; label: string }[], rows: any[], idField: string, table: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(c => <TableHead key={c.key}>{c.label}</TableHead>)}
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row: any) => (
          <TableRow key={row[idField]}>
            {columns.map(c => <TableCell key={c.key}>{row[c.key] ?? '-'}</TableCell>)}
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
          <TabsTrigger value="cuencas">Cuencas</TabsTrigger>
          <TabsTrigger value="campos">Campos</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
        </TabsList>

        {['unidades', 'biozonas', 'edades', 'empresas', 'cuencas', 'campos', 'contratos', 'personas'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditing(null); setShowForm(true) }}>Nuevo</Button>
            </div>
            {tab === 'unidades' && renderTable([
              { key: 'unidad_lito_id', label: 'ID' },
              { key: 'nombre_oficial', label: 'Nombre Oficial' },
              { key: 'tipo_unidad', label: 'Tipo Unidad' },
              { key: 'rango', label: 'Rango' },
            ], unidades || [], 'unidad_lito_id', 'dic_unidad_lito')}
            {tab === 'biozonas' && renderTable([
              { key: 'biozona_id', label: 'ID' },
              { key: 'nombre_biozona', label: 'Nombre Biozona' },
              { key: 'grupo_fosil', label: 'Grupo Fósil' },
              { key: 'edad_tope', label: 'Edad Tope' },
              { key: 'edad_base', label: 'Edad Base' },
            ], biozonas || [], 'biozona_id', 'dic_biozona')}
            {tab === 'edades' && renderTable([
              { key: 'edad_id', label: 'ID' },
              { key: 'nombre_edad', label: 'Edad' },
              { key: 'jerarquia', label: 'Jerarquía' },
              { key: 'tope_ma', label: 'Tope (Ma)' },
              { key: 'base_ma', label: 'Base (Ma)' },
            ], edades || [], 'edad_id', 'dic_edad')}
            {tab === 'empresas' && renderTable([
              { key: 'empresa_id', label: 'ID' },
              { key: 'nombre_empresa', label: 'Empresa' },
              { key: 'tipo_empresa', label: 'Tipo Empresa' },
              { key: 'pais', label: 'País' },
            ], empresas || [], 'empresa_id', 'empresa')}
            {tab === 'cuencas' && renderTable([
              { key: 'cuenca_id', label: 'ID' },
              { key: 'nombre_cuenca', label: 'Cuenca' },
            ], cuencas || [], 'cuenca_id', 'dic_cuenca')}
            {tab === 'campos' && renderTable([
              { key: 'campo_id', label: 'ID' },
              { key: 'nombre_campo', label: 'Campo' },
            ], campos || [], 'campo_id', 'dic_campo')}
            {tab === 'contratos' && renderTable([
              { key: 'contrato_id', label: 'ID' },
              { key: 'nombre_contrato', label: 'Contrato' },
            ], contratos || [], 'contrato_id', 'dic_contrato')}
            {tab === 'personas' && renderTable([
              { key: 'persona_id', label: 'ID' },
              { key: 'nombre', label: 'Nombre' },
              { key: 'rol', label: 'Rol' },
              { key: 'email', label: 'Email' },
              { key: 'activo', label: 'Activo' },
            ], personas || [], 'persona_id', 'persona')}
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
            {activeTab === 'cuencas' && (
              <CuencaForm
                defaultValues={editing}
                onSubmit={(v) => handleSave('dic_cuenca', v, 'cuenca_id')}
                onCancel={() => { setShowForm(false); setEditing(null) }}
              />
            )}
            {activeTab === 'campos' && (
              <CampoForm
                defaultValues={editing}
                onSubmit={(v) => handleSave('dic_campo', v, 'campo_id')}
                onCancel={() => { setShowForm(false); setEditing(null) }}
              />
            )}
            {activeTab === 'contratos' && (
              <ContratoForm
                defaultValues={editing}
                onSubmit={(v) => handleSave('dic_contrato', v, 'contrato_id')}
                onCancel={() => { setShowForm(false); setEditing(null) }}
              />
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
