import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { buildImportBatches, readHeadersForTables, TABLE_CONFIG } from '../../src/lib/importMapping'

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

  it('expone una plantilla por cada variante geológica con columnas oficiales', () => {
    const variants = [
      'dic_uni_lito_reportada', 'dic_uni_lito_normalizada', 'dic_uni_lito_actualizada',
      'dic_biozona_reportada', 'dic_biozona_normalizada', 'dic_biozona_actualizada',
      'dic_edad_reportada', 'dic_edad_normalizada', 'dic_edad_actualizada',
    ] as const

    for (const variant of variants) {
      expect(TABLE_CONFIG[variant].label).toBeTruthy()
      expect(TABLE_CONFIG[variant].columns).toEqual(Object.keys(TABLE_CONFIG[variant].sample))
      expect(TABLE_CONFIG[variant].columns).not.toContain('uni_lito_reportada_id')
      expect(TABLE_CONFIG[variant].columns).not.toContain('uni_lito_normalizada_id')
      expect(TABLE_CONFIG[variant].columns).not.toContain('uni_lito_actualizada_id')
      expect(TABLE_CONFIG[variant].columns).not.toContain('biozona_reportada_id')
      expect(TABLE_CONFIG[variant].columns).not.toContain('biozona_normalizada_id')
      expect(TABLE_CONFIG[variant].columns).not.toContain('biozona_actualizada_id')
      expect(TABLE_CONFIG[variant].columns).not.toContain('edad_reportada_id')
      expect(TABLE_CONFIG[variant].columns).not.toContain('edad_normalizada_id')
      expect(TABLE_CONFIG[variant].columns).not.toContain('edad_actualizada_id')
      expect(TABLE_CONFIG[variant].columns).not.toContain('created_at')
      expect(TABLE_CONFIG[variant].columns).not.toContain('updated_at')
    }
  })

  it('construye un batch para cada variante geológica', () => {
    const variants = Object.keys(TABLE_CONFIG).filter((table) => table.startsWith('dic_')) as Array<Extract<TableKey, `dic_${string}`>>
    const workbook = XLSX.utils.book_new()
    for (const table of variants) {
      const column = TABLE_CONFIG[table].columns[0]
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ [column]: 'value' }]), TABLE_CONFIG[table].label)
    }
    const batches = buildImportBatches(workbook, variants, Object.fromEntries(variants.map((table) => [table, { [TABLE_CONFIG[table].columns[0]]: TABLE_CONFIG[table].columns[0] }])))
    expect(batches.map((batch) => batch.table)).toEqual(variants)
  })

  it('incluye fecha_revision en pozo, placa y muestra', () => {
    expect(TABLE_CONFIG.pozo.columns).toContain('fecha_revision')
    expect(TABLE_CONFIG.placa.columns).toContain('fecha_revision')
    expect(TABLE_CONFIG.muestra.columns).toContain('fecha_revision')
  })
})
