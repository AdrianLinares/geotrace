import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { buildImportBatches, readHeadersForTables } from '../../src/lib/importMapping'

function workbookWithDifferentSheets() {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    { codigo_coleccion: 'COL-001', nombre_coleccion: 'Colección 1' },
  ]), 'Colecciones')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    { codigo_pozo: 'POZ-001', nombre_pozo: 'Pozo 1' },
  ]), 'Pozos')
  return workbook
}

describe('importación multihoja', () => {
  it('lee headers separados para cada hoja', () => {
    const headers = readHeadersForTables(workbookWithDifferentSheets(), ['coleccion', 'pozo'])

    expect(headers).toEqual({
      coleccion: ['codigo_coleccion', 'nombre_coleccion'],
      pozo: ['codigo_pozo', 'nombre_pozo'],
    })
  })

  it('construye el payload con el mapping propio de cada hoja', () => {
    const batches = buildImportBatches(workbookWithDifferentSheets(), ['coleccion', 'pozo'], {
      coleccion: { codigo_coleccion: 'codigo_coleccion' },
      pozo: { codigo_pozo: 'codigo_pozo' },
    })

    expect(batches).toEqual([
      { table: 'coleccion', rows: [{ codigo_coleccion: 'COL-001' }] },
      { table: 'pozo', rows: [{ codigo_pozo: 'POZ-001' }] },
    ])
  })
})
