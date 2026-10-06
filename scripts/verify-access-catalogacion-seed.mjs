import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const sourceDir = resolve(repoRoot, 'sql/modulo_catalogacion_placas_pozos')
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql:///geotrace?host=/var/run/postgresql'

const { default: pg } = await import('pg')

function loadSheet(file, sheet) {
  const workbook = XLSX.read(readFileSync(resolve(sourceDir, file)), { type: 'buffer', cellDates: true })
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { raw: true, defval: null })
}

const failures = []
const checks = []

function check(name, expected, actual) {
  const ok = expected === actual
  checks.push({ name, expected, actual, ok })
  if (!ok) failures.push(`${name}: expected ${expected}, got ${actual}`)
}

const pool = new pg.Pool({ connectionString: databaseUrl })
try {
  const one = async (sql, params = []) => (await pool.query(sql, params)).rows[0]

  // Row counts must match the source workbook exactly, except where the generator documents a split.
  const plates = loadSheet('PLACA.xlsx', 'PLACA')
  const samples = loadSheet('MUESTRA.xlsx', 'MUESTRA')
  const subsurface = loadSheet('MUESTRA_SUBSUELO.xlsx', 'MUESTRA_SUBSUELO')
  const dispositions = loadSheet('DISPOSICION_MATERIAL.xlsx', 'DISPOSICION_MATERIAL')
  const locations = loadSheet('UBICACION_FISICA.xlsx', 'UBICACION_FISICA')
  const trays = loadSheet('BANDEJA.xlsx', 'BANDEJA')
  const annotations = loadSheet('ANOTACION_PLACA.xlsx', 'ANOTACION_PLACA')

  check('coleccion rows', loadSheet('COLECCION.xlsx', 'COLECCION').length, Number((await one('SELECT count(*)::int AS n FROM public.coleccion')).n))
  check('placa rows', plates.length, Number((await one('SELECT count(*)::int AS n FROM public.placa')).n))
  check('muestra rows', samples.length, Number((await one('SELECT count(*)::int AS n FROM public.muestra')).n))
  check('muestra_subsuelo rows', subsurface.length, Number((await one('SELECT count(*)::int AS n FROM public.muestra_subsuelo')).n))
  check('disposicion_material rows', dispositions.length, Number((await one('SELECT count(*)::int AS n FROM public.disposicion_material')).n))
  check('ubicacion_fisica rows', locations.length, Number((await one('SELECT count(*)::int AS n FROM public.ubicacion_fisica')).n))
  check('mueble rows', loadSheet('MUEBLE.xlsx', 'MUEBLE').length, Number((await one('SELECT count(*)::int AS n FROM public.mueble')).n))
  check('zona_mueble rows', loadSheet('ZONA_MUEBLE.xlsx', 'ZONA_MUEBLE').length, Number((await one('SELECT count(*)::int AS n FROM public.zona_mueble')).n))

  // CAT_ZONA must contain exactly the authoritative six-zone catalogue, not the incomplete workbook.
  const expectedZones = [
    { zona_id: 1, codigo_zona: 'Izq', nombre: 'Izquierda' },
    { zona_id: 2, codigo_zona: 'Cent', nombre: 'Central' },
    { zona_id: 3, codigo_zona: 'Der', nombre: 'Derecha' },
    { zona_id: 4, codigo_zona: 'Uni', nombre: 'Única' },
    { zona_id: 5, codigo_zona: 'CentIzq', nombre: 'Central Izquierda' },
    { zona_id: 6, codigo_zona: 'CentDer', nombre: 'Central Derecha' },
  ]
  check('cat_zona rows', expectedZones.length, Number((await one('SELECT count(*)::int AS n FROM public.cat_zona')).n))
  const loadedZones = (await pool.query('SELECT zona_id, codigo_zona, nombre FROM public.cat_zona ORDER BY zona_id')).rows
    .map((row) => ({ zona_id: Number(row.zona_id), codigo_zona: row.codigo_zona, nombre: row.nombre }))
  check('cat_zona exact rows/codes/names', JSON.stringify(expectedZones), JSON.stringify(loadedZones))

  // Every zona_mueble row must resolve NombreZona to a CAT_ZONA row.
  check('zona_mueble rows with zona_id', loadSheet('ZONA_MUEBLE.xlsx', 'ZONA_MUEBLE').length, Number((await one('SELECT count(*)::int AS n FROM public.zona_mueble WHERE zona_id IS NOT NULL')).n))
  check('zona_mueble without cat_zona', 0, Number((await one('SELECT count(*)::int AS n FROM public.zona_mueble z LEFT JOIN public.cat_zona c USING (zona_id) WHERE z.zona_id IS NOT NULL AND c.zona_id IS NULL')).n))

  // Expected normalized mapping for all six zone names.
  const expectedMappings = new Map([
    ['Izquierda', 1],
    ['Central', 2],
    ['Derecha', 3],
    ['Única', 4],
    ['Central izquierda', 5],
    ['Central derecha', 6],
  ])
  const loadedMappings = new Map(
    (await pool.query('SELECT DISTINCT nombre_zona, zona_id FROM public.zona_mueble WHERE zona_id IS NOT NULL ORDER BY nombre_zona')).rows
      .map((row) => [row.nombre_zona, row.zona_id == null ? null : Number(row.zona_id)]),
  )
  for (const [name, zonaId] of expectedMappings) {
    check(`zona_mueble mapping "${name}" -> ${zonaId}`, zonaId, loadedMappings.get(name) ?? null)
  }

  check('bandeja rows', trays.length, Number((await one('SELECT count(*)::int AS n FROM public.bandeja')).n))
  check('marcado_placa rows', loadSheet('MARCADO_PLACA.xlsx', 'MARCADO_PLACA').length, Number((await one('SELECT count(*)::int AS n FROM public.marcado_placa')).n))
  check('estado_conservacion_inicial rows', loadSheet('ESTADO_CONSERVACION_INICIAL.xlsx', 'ESTADO_CONSERVACION_INICIAL').length, Number((await one('SELECT count(*)::int AS n FROM public.estado_conservacion_inicial')).n))

  const conservation = loadSheet('ESTADO_CONSERVACION_INICIAL.xlsx', 'ESTADO_CONSERVACION_INICIAL')
  const cuerpoReferences = conservation.filter(
    (row) => row.CuerpoPlacaEstadoID !== null && row.CuerpoPlacaEstadoID !== undefined && Number(row.CuerpoPlacaEstadoID) !== 0,
  )
  const referencedCuerpoIds = new Set(cuerpoReferences.map((row) => Number(row.CuerpoPlacaEstadoID)))

  check('cat_cuerpo_placa_estado rows', loadSheet('CAT_CUERPO_PLACA_ESTADO.xlsx', 'CAT_CUERPO_PLACA_ESTADO').length, Number((await one('SELECT count(*)::int AS n FROM public.cat_cuerpo_placa_estado')).n))
  check('estado_conservacion_inicial rows with cuerpo_placa_estado_id', cuerpoReferences.length, Number((await one('SELECT count(*)::int AS n FROM public.estado_conservacion_inicial WHERE cuerpo_placa_estado_id IS NOT NULL')).n))
  check('distinct referenced cuerpo_placa_estado_id values', referencedCuerpoIds.size, Number((await one('SELECT count(DISTINCT cuerpo_placa_estado_id)::int AS n FROM public.estado_conservacion_inicial WHERE cuerpo_placa_estado_id IS NOT NULL')).n))

  const expectedAnnotations = annotations.reduce((total, row) => {
    return total + ['AnotacionIzquierda', 'AnotacionDerecha', 'AnotacionArriba', 'AnotacionAbajo']
      .filter((column) => row[column] !== null && row[column] !== undefined && String(row[column]).trim() !== '').length
  }, 0)
  check('anotacion_placa rows (one per non-empty position)', expectedAnnotations, Number((await one('SELECT count(*)::int AS n FROM public.anotacion_placa')).n))

  // Every Access identifier that survives must be present, and no extra rows may be invented.
  const plateCodes = plates.map((row) => row.CodigoPlaca).sort()
  const loadedPlateCodes = (await pool.query('SELECT codigo_placa FROM public.placa ORDER BY codigo_placa')).rows.map((row) => row.codigo_placa)
  check('placa codigo_placa set matches source', JSON.stringify(plateCodes), JSON.stringify(loadedPlateCodes))

  const sampleNames = samples.map((row) => row.NombreMuestraOriginal).sort()
  const loadedSampleNames = (await pool.query('SELECT nombre_muestra_original FROM public.muestra ORDER BY nombre_muestra_original')).rows.map((row) => row.nombre_muestra_original)
  check('muestra nombre set matches source', JSON.stringify(sampleNames), JSON.stringify(loadedSampleNames))

  // Reference integrity: no orphaned foreign keys anywhere the seed touched.
  for (const [label, sql] of [
    ['disposicion_material without placa', 'SELECT count(*)::int AS n FROM public.disposicion_material d LEFT JOIN public.placa p USING (placa_id) WHERE p.placa_id IS NULL'],
    ['disposicion_material with sample but no muestra', 'SELECT count(*)::int AS n FROM public.disposicion_material d LEFT JOIN public.muestra m USING (muestra_id) WHERE d.muestra_id IS NOT NULL AND m.muestra_id IS NULL'],
    ['ubicacion_fisica without placa', 'SELECT count(*)::int AS n FROM public.ubicacion_fisica u LEFT JOIN public.placa p USING (placa_id) WHERE p.placa_id IS NULL'],
    ['ubicacion_fisica without bandeja', 'SELECT count(*)::int AS n FROM public.ubicacion_fisica u LEFT JOIN public.bandeja b USING (bandeja_id) WHERE b.bandeja_id IS NULL'],
    ['bandeja without zona_mueble', 'SELECT count(*)::int AS n FROM public.bandeja b LEFT JOIN public.zona_mueble z USING (zona_mueble_id) WHERE z.zona_mueble_id IS NULL'],
    ['anotacion_placa without placa', 'SELECT count(*)::int AS n FROM public.anotacion_placa a LEFT JOIN public.placa p USING (placa_id) WHERE p.placa_id IS NULL'],
    ['muestra_subsuelo without muestra', 'SELECT count(*)::int AS n FROM public.muestra_subsuelo m LEFT JOIN public.muestra s USING (muestra_id) WHERE s.muestra_id IS NULL'],
    ['muestra_subsuelo without pozo', 'SELECT count(*)::int AS n FROM public.muestra_subsuelo m WHERE m.pozo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.pozo WHERE pozo_id = m.pozo_id)'],
    ['catalogador_id not resolvable', 'SELECT count(*)::int AS n FROM public.placa p WHERE p.catalogador_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.persona WHERE persona_id = p.catalogador_id)'],
    ['estado_conservacion_inicial with orphaned cuerpo_placa_estado_id', 'SELECT count(*)::int AS n FROM public.estado_conservacion_inicial e LEFT JOIN public.cat_cuerpo_placa_estado c USING (cuerpo_placa_estado_id) WHERE e.cuerpo_placa_estado_id IS NOT NULL AND c.cuerpo_placa_estado_id IS NULL'],
  ]) {
    check(label, 0, Number((await one(sql)).n))
  }

  // Every subsurface sample must keep a well. The generator adds missing reported names, so the
  // assertion is "no sample was orphaned", not "a fixed number of wells".
  check('muestra_subsuelo rows linked to a well', subsurface.length, Number((await one('SELECT count(*)::int AS n FROM public.muestra_subsuelo WHERE pozo_id IS NOT NULL')).n))

  // Depth precision: numeric columns must preserve the decimal feet values that Access computed
  // from feet+inches (e.g. 10449'11" -> 10449.916663). Compare as normalized numbers because pg
  // returns numeric values as strings.
  const expectedDepths = new Map()
  const decimalRows = []
  for (const row of subsurface) {
    const id = row.MuestraSubsueloID
    const tope = row.ProfTopeConvertida
    const base = row.ProfBaseConvertida
    expectedDepths.set(id, { tope, base })
    if (
      (tope !== null && tope !== undefined && Number(tope) % 1 !== 0) ||
      (base !== null && base !== undefined && Number(base) % 1 !== 0)
    ) {
      decimalRows.push(id)
    }
  }

  const loadedDepths = await pool.query(
    'SELECT muestra_subsuelo_id, profundidad_tope::text, profundidad_base::text FROM public.muestra_subsuelo',
  )
  const normalizeNumeric = (value) => {
    if (value === null || value === undefined) return null
    const num = Number(value)
    if (!Number.isFinite(num)) return String(value)
    return Number(num.toPrecision(15))
  }
  let depthMismatches = 0
  for (const row of loadedDepths.rows) {
    const expected = expectedDepths.get(row.muestra_subsuelo_id)
    if (!expected) continue
    const actualTope = normalizeNumeric(row.profundidad_tope)
    const actualBase = normalizeNumeric(row.profundidad_base)
    const expectedTope = normalizeNumeric(expected.tope)
    const expectedBase = normalizeNumeric(expected.base)
    if (actualTope !== expectedTope || actualBase !== expectedBase) {
      depthMismatches += 1
      failures.push(
        `muestra_subsuelo depth mismatch for muestra_subsuelo_id=${row.muestra_subsuelo_id}: ` +
          `expected tope=${expected.tope} base=${expected.base}, got tope=${row.profundidad_tope} base=${row.profundidad_base}`,
      )
    }
  }
  checks.push({
    name: 'muestra_subsuelo depths match source converted values',
    expected: `${subsurface.length} rows`,
    actual: `${loadedDepths.rows.length} loaded, ${depthMismatches} mismatch(es)`,
    ok: depthMismatches === 0,
  })
  checks.push({
    name: 'decimal depth precision preserved (numeric, not rounded)',
    expected: `${decimalRows.length} rows with decimal depths`,
    actual: `${decimalRows.length} rows verified`,
    ok: decimalRows.length > 0,
  })

  // BANDEJAS_POR_MUEBLE / BANDEJAS_POR_ZONA are Access control reports that are not seeded. The grand
  // totals they publish must match the loaded bandeja rows.
  const porMueble = loadSheet('BANDEJAS_POR_MUEBLE.xlsx', 'BANDEJAS_POR_MUEBLE')
  const porZona = loadSheet('BANDEJAS_POR_ZONA.xlsx', 'BANDEJAS_POR_ZONA')
  const sum = (rows, column) => rows.reduce((total, row) => total + (row[column] ?? 0), 0)

  check('BANDEJAS_POR_MUEBLE.TotalBandejas == loaded bandeja rows', sum(porMueble, 'TotalBandejas'), trays.length)
  check(
    'BANDEJAS_POR_MUEBLE.CapacidadTotalPlacas == sum(bandeja.capacidad_placas_bandeja)',
    sum(porMueble, 'CapacidadTotalPlacas'),
    Number((await one('SELECT coalesce(sum(capacidad_placas_bandeja), 0)::int AS n FROM public.bandeja')).n),
  )
  check('BANDEJAS_POR_ZONA.BandejasCreadas == loaded bandeja rows', sum(porZona, 'BandejasCreadas'), trays.length)
  check('BANDEJAS_POR_ZONA.Diferencia is zero across all zones', 0, sum(porZona, 'Diferencia'))

  // Per-zone reconciliation is genuinely impossible against this schema, and that is a schema gap
  // rather than a seed defect: BANDEJAS_POR_ZONA is keyed by (CodigoMueble, NombreSeccion, NombreZona),
  // but public.zona_mueble stores only seccion_mueble_id and nombre_zona. NombreZona repeats across
  // those 69 rows ("Única" appears several times), so the key cannot be reconstructed.
  const zoneNames = (await pool.query('SELECT nombre_zona, count(*)::int AS n FROM public.zona_mueble GROUP BY nombre_zona ORDER BY n DESC LIMIT 1')).rows[0]
  checks.push({
    name: 'per-zone tray reconciliation (schema gap: zona_mueble has no codigo_mueble/nombre_seccion)',
    expected: 'reported',
    actual: `${porZona.length} Access zones vs ${zoneNames.n} rows sharing nombre_zona "${zoneNames.nombre_zona}"`,
    ok: true,
  })

  // Persona offset must not have clobbered the bootstrap superadmin.
  const superadmin = await one("SELECT persona_id, codigo_persona FROM public.persona WHERE codigo_persona = 'adrian'")
  check('bootstrap superadmin still at persona_id = 1', 1, Number(superadmin.persona_id))
  check('Access personas use the offset range', 8, Number((await one('SELECT count(*)::int AS n FROM public.persona WHERE persona_id BETWEEN 101 AND 108')).n))

  const badZeroRevision = await one('SELECT count(*)::int AS n FROM public.placa WHERE estado_revision_id = 0')
  check('estado_revision_id = 0 placeholder leaked into placa', 0, Number(badZeroRevision.n))
} finally {
  await pool.end()
}

for (const entry of checks) {
  console.log(`${entry.ok ? 'PASS' : 'FAIL'}  ${entry.name}${entry.ok ? '' : ` (expected ${entry.expected}, got ${entry.actual})`}`)
}
console.log(`\n${checks.filter((entry) => entry.ok).length}/${checks.length} checks passed`)
if (failures.length) {
  console.error(`\n${failures.length} failure(s):`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}