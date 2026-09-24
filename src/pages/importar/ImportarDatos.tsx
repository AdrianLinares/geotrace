import React, { useRef, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Button } from '../../components/ui/button'
import { importBatches } from '../../lib/importApi'
import { buildImportBatches, readHeadersForTables, TABLE_CONFIG, type HeadersByTable, type TableKey, type TableMappings } from '../../lib/importMapping'
import * as XLSX from 'xlsx'

const ALL_TABLES = Object.keys(TABLE_CONFIG) as TableKey[]

export default function ImportarDatos() {
  const [file, setFile] = useState<File | null>(null)
  const [selectedTables, setSelectedTables] = useState<Set<TableKey>>(new Set(['placa']))
  const [headersByTable, setHeadersByTable] = useState<HeadersByTable>({})
  const [mappings, setMappings] = useState<TableMappings>({})
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleTable = (table: TableKey) => setSelectedTables((previous) => {
    const next = new Set(previous)
    if (next.has(table)) next.delete(table); else next.add(table)
    if (file && next.has(table)) {
      file.arrayBuffer().then((buffer) => {
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
        const nextHeaders = readHeadersForTables(workbook, [table])
        setHeadersByTable((current) => ({ ...current, ...nextHeaders }))
        setMappings((current) => ({ ...current, [table]: Object.fromEntries((nextHeaders[table] ?? []).map((header) => [header, ''])) }))
      }).catch((error) => setProgress(`Error: ${error instanceof Error ? error.message : 'No fue posible leer la hoja.'}`))
    }
    return next
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0]
    if (!nextFile) return
    setFile(nextFile)
    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(new Uint8Array(loadEvent.target?.result as ArrayBuffer), { type: 'array' })
        const nextHeaders = readHeadersForTables(workbook, selectedTables)
        setHeadersByTable(nextHeaders)
        setMappings(Object.fromEntries(Object.entries(nextHeaders).map(([table, headers]) => [table, Object.fromEntries((headers ?? []).map((header) => [header, '']))])) as TableMappings)
        setProgress('')
      } catch (error) {
        setHeadersByTable({})
        setMappings({})
        setProgress(`Error: ${error instanceof Error ? error.message : 'No fue posible leer el archivo.'}`)
      }
    }
    reader.readAsArrayBuffer(nextFile)
  }

  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new()
    selectedTables.forEach((table) => {
      const config = TABLE_CONFIG[table]
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([config.sample]), config.label.slice(0, 31))
    })
    XLSX.writeFile(workbook, 'plantilla_importacion.xlsx')
  }

  const handleImport = async () => {
    if (!file || !selectedTables.size) return
    setImporting(true)
    setProgress('Leyendo archivo...')
    try {
      const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' })
      const batches = buildImportBatches(workbook, selectedTables, mappings)
      let totalImported = 0
      setProgress(`Enviando ${batches.reduce((total, batch) => total + batch.rows.length, 0)} registros en una sola transacción...`)
      const result = await importBatches(batches)
      totalImported = result.imported
      setProgress(`Importados ${totalImported} registros en total.`)
    } catch (error) {
      setProgress(`Error: ${error instanceof Error ? error.message : 'No fue posible importar los datos.'}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <AppLayout>
      <h2 className="text-xl font-semibold mb-6">Importación de Datos en Lote</h2>
      <div className="bg-white border rounded p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Tablas destino (selecciona una o varias)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{ALL_TABLES.map((table) => (
            <label key={table} className="flex items-center gap-2 text-sm border rounded p-2 cursor-pointer hover:bg-surface">
              <input type="checkbox" checked={selectedTables.has(table)} onChange={() => toggleTable(table)} className="rounded" />
              {TABLE_CONFIG[table].label}
            </label>
          ))}</div>
        </div>
        <div>
          <Button variant="outline" onClick={downloadTemplate} disabled={!selectedTables.size}>Descargar plantilla Excel</Button>
          <p className="text-xs text-gray-500 mt-1">Solo incluye columnas del esquema normalizado. Personas y roles se administran desde /usuarios.</p>
        </div>
        <div>
          <input type="file" accept=".xlsx,.xls" ref={inputRef} onChange={handleFileChange} className="block" />
          <p className="text-xs text-gray-500 mt-1">Solo se admiten libros Excel: debe tener una hoja por cada tabla seleccionada. CSV no está soportado porque este flujo depende de varias hojas.</p>
        </div>
        {selectedTables.size > 0 && <div>
          <h3 className="font-medium mb-2">Mapeo de columnas</h3>
          {[...selectedTables].map((table) => <fieldset key={table} className="border rounded p-3 mb-4">
            <legend className="font-medium px-1">{TABLE_CONFIG[table].label}</legend>
            {!headersByTable[table] && <p className="text-sm text-red-600">Hoja no leída o no disponible.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{(headersByTable[table] ?? []).map((column) => (
              <div key={`${table}-${column}`} className="flex items-center gap-2">
                <span className="text-sm w-1/2">{column}:</span>
                <select value={mappings[table]?.[column] || ''} onChange={(event) => setMappings((previous) => ({ ...previous, [table]: { ...(previous[table] ?? {}), [column]: event.target.value } }))} className="border p-1 rounded flex-1 text-sm">
                  <option value="">— ignorar —</option>
                  {TABLE_CONFIG[table].columns.map((databaseColumn) => <option key={`${table}-${databaseColumn}`} value={databaseColumn}>{databaseColumn}</option>)}
                </select>
              </div>
            ))}</div>
          </fieldset>)}
        </div>}
        {progress && <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border">{progress}</pre>}
        <div className="flex gap-2">
          <Button onClick={handleImport} disabled={!file || !selectedTables.size || importing}>{importing ? 'Importando...' : 'Importar Datos'}</Button>
          <Button variant="outline" onClick={() => { setFile(null); setHeadersByTable({}); setMappings({}); setProgress(''); if (inputRef.current) inputRef.current.value = '' }}>Limpiar</Button>
        </div>
      </div>
    </AppLayout>
  )
}
