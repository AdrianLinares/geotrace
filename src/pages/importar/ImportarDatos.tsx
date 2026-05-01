import React, { useRef, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Button } from '../../components/ui/button'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import type { Coleccion, Persona, Mueble, UbicacionFisica, Placa, Muestra } from '../../types/database'

type TableKey = keyof typeof TABLE_CONFIG

const TABLE_CONFIG = {
  coleccion: {
    label: 'Colecciones',
    columns: ['coleccion_id', 'nombre_coleccion', 'institucion', 'responsable', 'descripcion', 'estado_coleccion'],
    sample: { coleccion_id: 'COL-005', nombre_coleccion: 'Nueva Colección', institucion: 'SGC', responsable: 'Nombre', descripcion: '', estado_coleccion: 'Activa' } as Coleccion,
  },
  persona: {
    label: 'Personas',
    columns: ['persona_id', 'nombre', 'rol', 'email', 'activo'],
    sample: { persona_id: 'CAT-06', nombre: 'Nombre Apellido', rol: 'Catalogador', email: 'usuario@sgc.gov.co', activo: true } as Persona,
  },
  empresa: {
    label: 'Empresas',
    columns: ['empresa_id', 'nombre_empresa', 'tipo_empresa', 'pais', 'observaciones'],
    sample: { empresa_id: 'EMP-04', nombre_empresa: 'Nombre Empresa', tipo_empresa: 'Pública', pais: 'Colombia', observaciones: '' },
  },
  mueble: {
    label: 'Muebles',
    columns: ['mueble_cod', 'material_mueble', 'color', 'tiene_seccion', 'secciones_permitidas', 'tiene_zona', 'zonas_permitidas', 'max_bandejas', 'material_bandeja', 'capacidad_min', 'capacidad_max', 'ubicacion_fisica', 'observaciones'],
    sample: { mueble_cod: 'D-1', material_mueble: 'Madera', color: 'Café', tiene_seccion: true, secciones_permitidas: 'Superior;Inferior', tiene_zona: false, zonas_permitidas: '', max_bandejas: 28, material_bandeja: 'Cartón', capacidad_min: 10, capacidad_max: 20, ubicacion_fisica: '', observaciones: '' } as Mueble,
  },
  ubicacion_fisica: {
    label: 'Ubicaciones Físicas',
    columns: ['ubicacion_id', 'mueble_cod', 'seccion', 'zona', 'no_bandeja', 'columna', 'posicion_placa', 'tipo_mueble', 'color_mueble', 'material_bandeja', 'ocupada'],
    sample: { ubicacion_id: 'UBI-001', mueble_cod: 'HDC-1', seccion: 'Superior', zona: '', no_bandeja: 1, columna: 'A', posicion_placa: 1, tipo_mueble: 'Madera', color_mueble: 'Natural', material_bandeja: 'Cartón', ocupada: false } as UbicacionFisica,
  },
  placa: {
    label: 'Placas',
    columns: ['placa_id', 'ubicacion_id', 'coleccion_id', 'clase_placa', 'rol_placa', 'diseno_placa', 'total_cavidades', 'estado_placa', 'tipo_rejilla', 'cubierta', 'tipo_abrazadera', 'catalogador_id', 'estado_catalogacion'],
    sample: { placa_id: 'PL-000001', ubicacion_id: 'UBI-001', coleccion_id: 'COL-003', clase_placa: 'Circular', rol_placa: 'A', diseno_placa: 'Estándar', total_cavidades: 60, estado_placa: '', tipo_rejilla: 'Metálica', cubierta: 'Vidrio', tipo_abrazadera: 'Metálica', catalogador_id: 'CAT-01', estado_catalogacion: 'En proceso' } as Placa,
  },
  muestra: {
    label: 'Muestras',
    columns: ['muestra_id', 'placa_id', 'procedencia_muestra', 'nombre_pozo', 'tipo_muestra', 'tipo_profundidad', 'profundidad_puntual', 'profundidad_tope', 'profundidad_base', 'unidad_medida', 'cod_muestra', 'igm', 'no_preparacion', 'info_inferida', 'estado_catalogacion', 'fecha_estado', 'catalogador_id'],
    sample: { muestra_id: 'MUE-000001', placa_id: 'PL-000001', procedencia_muestra: 'Superficie', nombre_pozo: '', tipo_muestra: 'Sedimentaria', tipo_profundidad: 'Puntual', profundidad_puntual: 10, profundidad_tope: '', profundidad_base: '', unidad_medida: 'm', cod_muestra: 'M-001', igm: '', no_preparacion: 'P-01', info_inferida: false, estado_catalogacion: 'En proceso', fecha_estado: '', catalogador_id: 'CAT-01' } as Muestra,
  },
  dic_unidad_lito: {
    label: 'Unidades Litoestratigráficas',
    columns: ['unidad_lito_id', 'nombre_oficial', 'tipo_unidad', 'rango', 'edad_base', 'edad_tope'],
    sample: { unidad_lito_id: 'UL-001', nombre_oficial: 'Formación Ejemplo', tipo_unidad: 'Formación', rango: '', edad_base: '', edad_tope: '' },
  },
  dic_biozona: {
    label: 'Biozonas',
    columns: ['biozona_id', 'nombre_biozona', 'grupo_fosil', 'edad_base', 'edad_tope'],
    sample: { biozona_id: 'BZ-001', nombre_biozona: 'Biozona Ejemplo', grupo_fosil: 'Foraminíferos', edad_base: '', edad_tope: '' },
  },
  dic_edad: {
    label: 'Edades Geológicas',
    columns: ['edad_id', 'nombre_edad', 'jerarquia', 'base_ma', 'tope_ma'],
    sample: { edad_id: 'ED-001', nombre_edad: 'Mioceno', jerarquia: 'Periodo', base_ma: 23.03, tope_ma: 5.333 },
  },
} as const

const ALL_TABLES = Object.keys(TABLE_CONFIG) as TableKey[]

export default function ImportarDatos() {
  const [file, setFile] = useState<File | null>(null)
  const [selectedTables, setSelectedTables] = useState<Set<TableKey>>(new Set(['placa']))
  const [headers, setHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleTable = (t: TableKey) => {
    setSelectedTables(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t); else next.add(t)
      return next
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
      if (json.length) {
        setHeaders(json[0] as string[])
        const newMap: Record<string, string> = {}
        ;(json[0] as string[]).forEach(h => newMap[h] = '')
        setMappings(newMap)
      }
    }
    reader.readAsArrayBuffer(f)
  }

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    selectedTables.forEach(t => {
      const cfg = TABLE_CONFIG[t]
      const ws = XLSX.utils.json_to_sheet([cfg.sample])
      XLSX.utils.book_append_sheet(wb, ws, cfg.label.slice(0, 31))
    })
    XLSX.writeFile(wb, 'plantilla_importacion.xlsx')
  }

  const handleImport = async () => {
    if (!file || !selectedTables.size) return
    setImporting(true)
    setProgress('Leyendo archivo...')

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
      let totalImported = 0

      for (const t of selectedTables) {
        const sheetName = TABLE_CONFIG[t].label
        const sheet = workbook.Sheets[sheetName]
        if (!sheet) {
          setProgress(prev => prev + `\n⚠️ Hoja "${sheetName}" no encontrada, omitida.`)
          continue
        }

        const json = XLSX.utils.sheet_to_json(sheet) as any[]
        if (!json.length) continue

        const mapped = json.map(row => {
          const obj: any = {}
          Object.entries(mappings).forEach(([excelCol, dbField]) => {
            if (dbField && row[excelCol] !== undefined) obj[dbField] = row[excelCol]
          })
          return obj
        })

        setProgress(prev => prev + `\nEnviando ${mapped.length} registros a ${TABLE_CONFIG[t].label}...`)
        const { error } = await supabase.from(t).insert(mapped)
        if (error) throw new Error(`${TABLE_CONFIG[t].label}: ${error.message}`)
        totalImported += mapped.length
      }

      setProgress(`✅ Importados ${totalImported} registros en total.`)
      alert(`Importación exitosa: ${totalImported} registros.`)
    } catch (e: any) {
      setProgress(`❌ Error: ${e.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <AppLayout>
      <h2 className="text-xl font-semibold mb-6">Importación de Datos en Lote</h2>

      <div className="bg-white border rounded p-6 space-y-6">
        {/* Table selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Tablas destino (selecciona una o varias)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ALL_TABLES.map(t => (
              <label key={t} className="flex items-center gap-2 text-sm border rounded p-2 cursor-pointer hover:bg-surface">
                <input
                  type="checkbox"
                  checked={selectedTables.has(t)}
                  onChange={() => toggleTable(t)}
                  className="rounded"
                />
                {TABLE_CONFIG[t].label}
              </label>
            ))}
          </div>
        </div>

        {/* Template download */}
        <div>
          <Button variant="outline" onClick={downloadTemplate} disabled={!selectedTables.size}>
            Descargar plantilla Excel
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            Genera un archivo con una hoja por tabla seleccionada, usando los nombres de columna correctos.
          </p>
        </div>

        {/* File upload */}
        <div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            ref={inputRef}
            onChange={handleFileChange}
            className="block"
          />
          <p className="text-xs text-gray-500 mt-1">
            El archivo debe tener una hoja por cada tabla seleccionada, con los nombres de columna en la primera fila.
          </p>
        </div>

        {/* Mapping */}
        {headers.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Mapeo de columnas</h3>
            <p className="text-sm text-gray-500 mb-4">
              Selecciona qué campo de la base de datos corresponde a cada columna de Excel.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {headers.map(col => (
                <div key={col} className="flex items-center gap-2">
                  <span className="text-sm w-1/2">{col}:</span>
                  <select
                    value={mappings[col] || ''}
                    onChange={e => setMappings(prev => ({ ...prev, [col]: e.target.value }))}
                    className="border p-1 rounded flex-1 text-sm"
                  >
                    <option value="">— ignorar —</option>
                    {[...selectedTables].map(t =>
                      TABLE_CONFIG[t].columns.map((c: string) => (
                        <option key={`${t}-${c}`} value={c}>{TABLE_CONFIG[t].label}: {c}</option>
                      ))
                    )}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border">{progress}</pre>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleImport} disabled={!file || !selectedTables.size || importing}>
            {importing ? 'Importando...' : 'Importar Datos'}
          </Button>
          <Button variant="outline" onClick={() => {
            setFile(null)
            setHeaders([])
            setMappings({})
            setProgress('')
            if (inputRef.current) inputRef.current.value = ''
          }}>
            Limpiar
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
