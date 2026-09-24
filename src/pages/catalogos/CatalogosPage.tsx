import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { useCatalogos } from '../../hooks/useCatalogos'

type Column = { key: string; label: string }

const catalogs = [
  { key: 'cuencas', label: 'Cuencas', columns: [{ key: 'cuenca_id', label: 'ID' }, { key: 'nombre_cuenca', label: 'Nombre' }] },
  { key: 'clasesPlaca', label: 'Clases de placa', columns: [{ key: 'clase_placa_id', label: 'ID' }, { key: 'codigo_clase', label: 'Código' }, { key: 'nombre', label: 'Nombre' }] },
  { key: 'disenosPlaca', label: 'Diseños de placa', columns: [{ key: 'diseno_placa_id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }] },
  { key: 'estadosCatalogacion', label: 'Estados de catalogación', columns: [{ key: 'estado_catalogacion_id', label: 'ID' }, { key: 'estado', label: 'Estado' }, { key: 'significado', label: 'Significado' }] },
  { key: 'estadosRevision', label: 'Estados de revisión', columns: [{ key: 'estado_revision_id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }, { key: 'significado', label: 'Significado' }] },
  { key: 'materialesPlaca', label: 'Materiales de placa', columns: [{ key: 'material_placa_id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }] },
  { key: 'coloresPlaca', label: 'Colores de placa', columns: [{ key: 'color_placa_id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }] },
  { key: 'configuracionesCavidades', label: 'Configuraciones de cavidades', columns: [{ key: 'configuracion_cavidades_id', label: 'ID' }, { key: 'diseno_placa_id', label: 'Diseño' }, { key: 'total_cavidades', label: 'Cavidades' }] },
  { key: 'configuracionesRejilla', label: 'Configuraciones de rejilla', columns: [{ key: 'configuracion_rejilla_id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }, { key: 'numero_subdivisiones', label: 'Subdivisiones' }] },
  { key: 'etapasUsoPlaca', label: 'Etapas de uso de placa', columns: [{ key: 'etapa_uso_placa_id', label: 'ID' }, { key: 'codigo_etapa_uso_placa', label: 'Código' }, { key: 'nombre', label: 'Nombre' }] },
  { key: 'tiposProteccion', label: 'Tipos de protección', columns: [{ key: 'tipo_proteccion_id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }] },
  { key: 'sistemasEnsamble', label: 'Sistemas de ensamble', columns: [{ key: 'sistema_ensamble_id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }] },
] as const

function CatalogTable({ columns, rows }: { columns: readonly Column[]; rows: readonly Record<string, unknown>[] }) {
  return (
    <Table>
      <TableHeader><TableRow>{columns.map(column => <TableHead key={column.key}>{column.label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>
        {rows.map((row, index) => <TableRow key={String(row[columns[0].key] ?? index)}>{columns.map(column => <TableCell key={column.key}>{String(row[column.key] ?? '-')}</TableCell>)}</TableRow>)}
      </TableBody>
    </Table>
  )
}

export default function CatalogosPage() {
  const [activeTab, setActiveTab] = useState<string>(catalogs[0].key)
  const { data, isLoading, isError } = useCatalogos()

  return (
    <AppLayout>
      <h2 className="text-xl font-semibold mb-4">Catálogos normalizados</h2>
      <p className="mb-4 text-sm text-slate-600">Esta pantalla es de solo lectura. Las altas, ediciones y eliminaciones de catálogos requieren un work unit de escritura con permisos explícitos.</p>
      {isError && <p role="alert" className="mb-4 text-sm text-red-600">No se pudieron cargar los catálogos.</p>}
      {isLoading && <p className="mb-4 text-sm text-slate-600">Cargando catálogos...</p>}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>{catalogs.map(catalog => <TabsTrigger key={catalog.key} value={catalog.key}>{catalog.label}</TabsTrigger>)}</TabsList>
        {catalogs.map(catalog => (
          <TabsContent key={catalog.key} value={catalog.key}>
            <CatalogTable columns={catalog.columns} rows={(data?.[catalog.key as keyof typeof data] ?? []) as readonly Record<string, unknown>[]} />
          </TabsContent>
        ))}
      </Tabs>
      <section className="mt-6 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <h3 className="font-semibold">Catálogos no disponibles en el esquema normalizado</h3>
        <p className="mt-1">No se muestran ni se escriben dic_unidad_lito, dic_biozona, dic_edad, empresa, dic_campo ni dic_contrato: sus tablas no existen en <code>sql/schema.sql</code>. MuestraModal, auditoría, anotaciones y catálogos de escritura compleja quedan fuera de este work unit.</p>
      </section>
    </AppLayout>
  )
}
