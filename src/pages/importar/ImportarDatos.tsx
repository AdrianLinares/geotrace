import React, { useRef } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Button } from '../../components/ui/button'
import * as XLSX from 'xlsx'

type ImportConfig = {
  table: string
  mappings: { excelColumn: string; dbField: string }[]
}

const TABLES = [
  { value: 'coleccion', label: 'Colecciones' },
  { value: 'persona', label: 'Personas' },
  { value: 'empresa', label: 'Empresas' },
  { value: 'mueble', label: 'Muebles' },
  { value: 'ubicacion_fisica', label: 'Ubicaciones Físicas' },
  { value: 'placa', label: 'Placas' },
  { value: 'muestra', label: 'Muestras' },
  { value: 'dic_unidad_lito', label: 'Unidades Litoestratigráficas' },
  { value: 'dic_biozona', label: 'Biozonas' },
  { value: 'dic_edad', label: 'Edades Geológicas' },
]

export default function ImportarDatos() {
  const [file, setFile] = React.useState<File | null>(null)
  const [table, setTable] = React.useState('placa')
  const [headers, setHeaders] = React.useState<string[]>([])
  const [mappings, setMappings] = React.useState<Record<string, string>>({})
  const [importing, setImporting] = React.useState(false)
  const [progress, setProgress] = React.useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)

    // Read headers
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
      if (json.length) {
        setHeaders(json[0] as string[])
        // Reset mappings
        const newMap: Record<string, string> = {}
        (json[0] as string[]).forEach(h => newMap[h] = '')
        setMappings(newMap)
      }
    }
    reader.readAsArrayBuffer(f)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setProgress('Leyendo archivo...')

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet) as any[]

      // Map to DB fields
      const mapped = json.map(row => {
        const obj: any = {}
        Object.entries(mappings).forEach(([excelCol, dbField]) => {
          if (dbField && row[excelCol] !== undefined) {
            obj[dbField] = row[excelCol]
          }
        })
        return obj
      })

      setProgress(`Enviando ${mapped.length} registros...`)

      // Batch insert
      const { error } = await supabase.from(table).insert(mapped)
      if (error) throw error

      setProgress(`✅ Importados ${mapped.length} registros a ${table}.`)
      alert(`Importación exitosa: ${mapped.length} registros.`)
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
        {/* Select table */}
        <div>
          <label className="block text-sm font-medium mb-2">Tabla destino</label>
          <select
            value={table}
            onChange={e => setTable(e.target.value)}
            className="border p-2 rounded w-full max-w-xs"
          >
            {TABLES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
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
        </div>

        {/* Mapping */}
        {headers.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Mapeo de columnas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona qué campo de la base de datos corresponde a cada columna de Excel.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {headers.map(col => (
                <div key={col} className="flex items-center gap-2">
                  <span className="text-sm w-1/2">{col}:</span>
                  <input
                    type="text"
                    value={mappings[col] || ''}
                    onChange={e => setMappings(prev => ({ ...prev, [col]: e.target.value }))}
                    placeholder="campo_db"
                    className="border p-1 rounded flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="text-sm">{progress}</div>
        )}

        {/* Import button */}
        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={!file || importing}
          >
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
