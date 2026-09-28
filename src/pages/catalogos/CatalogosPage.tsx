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

const geologicalCatalogs = [
  { key: 'unidadesLitoestratigraficas', label: 'Unidades litoestratigráficas', variants: [
    { key: 'reportada', label: 'Reportada', columns: [{ key: 'uni_lito_reportada_id', label: 'ID' }, { key: 'codigo_uni_lito_reportada', label: 'Código' }, { key: 'nombre_reportado', label: 'Nombre reportado' }] },
    { key: 'normalizada', label: 'Normalizada', columns: [{ key: 'uni_lito_normalizada_id', label: 'ID' }, { key: 'cod_uni_lito_normalizada', label: 'Código' }, { key: 'nombre_normalizado', label: 'Nombre normalizado' }, { key: 'rango_lito_id', label: 'Rango lito' }] },
    { key: 'actualizada', label: 'Actualizada', columns: [{ key: 'uni_lito_actualizada_id', label: 'ID' }, { key: 'cod_uni_lito_actualizada', label: 'Código' }, { key: 'nombre_oficial', label: 'Nombre oficial' }, { key: 'estado_nomenclatura_id', label: 'Estado nomenclatura' }] },
  ] },
  { key: 'biozonas', label: 'Biozonas', variants: [
    { key: 'reportada', label: 'Reportada', columns: [{ key: 'biozona_reportada_id', label: 'ID' }, { key: 'codigo_biozona', label: 'Código' }, { key: 'nombre_reportado', label: 'Nombre reportado' }] },
    { key: 'normalizada', label: 'Normalizada', columns: [{ key: 'biozona_normalizada_id', label: 'ID' }, { key: 'codigo_biozona', label: 'Código' }, { key: 'nombre_normalizado', label: 'Nombre normalizado' }] },
    { key: 'actualizada', label: 'Actualizada', columns: [{ key: 'biozona_actualizada_id', label: 'ID' }, { key: 'codigo_biozona_actual', label: 'Código' }, { key: 'nombre_actualizado', label: 'Nombre actualizado' }, { key: 'fuente_actualizacion', label: 'Fuente' }] },
  ] },
  { key: 'edades', label: 'Edades', variants: [
    { key: 'reportada', label: 'Reportada', columns: [{ key: 'edad_reportada_id', label: 'ID' }, { key: 'nombre_reportado', label: 'Nombre reportado' }] },
    { key: 'normalizada', label: 'Normalizada', columns: [{ key: 'edad_normalizada_id', label: 'ID' }, { key: 'nombre_normalizado', label: 'Nombre normalizado' }, { key: 'rango_cronoestratigrafico_id', label: 'Rango cronoestratigráfico' }] },
    { key: 'actualizada', label: 'Actualizada', columns: [{ key: 'edad_actualizada_id', label: 'ID' }, { key: 'nombre_actualizado', label: 'Nombre actualizado' }, { key: 'escala_tiempo', label: 'Escala de tiempo' }] },
  ] },
] as const

function CatalogTable({ columns, rows }: { columns: readonly Column[]; rows: readonly Record<string, unknown>[] }) {
  if (!rows.length) return <p className="py-4 text-sm text-slate-600">No hay registros para esta variante.</p>
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
      <section className="mt-6">
        <h3 className="mb-3 text-lg font-semibold">Catálogos geológicos normalizados</h3>
        <Tabs defaultValue={geologicalCatalogs[0].key}>
          <TabsList>{geologicalCatalogs.map(catalog => <TabsTrigger key={catalog.key} value={catalog.key}>{catalog.label}</TabsTrigger>)}</TabsList>
          {geologicalCatalogs.map(catalog => (
            <TabsContent key={catalog.key} value={catalog.key}>
              <Tabs defaultValue={catalog.variants[0].key}>
                <TabsList>{catalog.variants.map(variant => <TabsTrigger key={variant.key} value={variant.key}>{variant.label}</TabsTrigger>)}</TabsList>
                {catalog.variants.map(variant => (
                  <TabsContent key={variant.key} value={variant.key}>
                    <p className="mb-2 text-sm text-slate-600">Variante: <strong>{variant.label}</strong></p>
                    <CatalogTable columns={variant.columns} rows={((data?.[catalog.key as keyof typeof data] as { [key: string]: readonly Record<string, unknown>[] } | undefined)?.[variant.key] ?? [])} />
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>
          ))}
        </Tabs>
      </section>
      <section className="mt-6 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <h3 className="font-semibold">Catálogos sin equivalente directo</h3>
        <p className="mt-1">Empresa, dic_campo y dic_contrato permanecen no disponibles porque no tienen equivalentes directos confirmados en <code>sql/schema.sql</code>. Las tres familias geológicas se muestran mediante sus tablas normalizadas; esta unidad sigue siendo de solo lectura y no agrega CRUD.</p>
      </section>
    </AppLayout>
  )
}
