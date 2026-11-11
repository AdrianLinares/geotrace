import { describe, expect, it, vi } from 'vitest'
import { createAdminRepository, createCatalogRepository, createConservationRepository, createReadRepository, createRoleRepository, createSessionRepository, LastAdministratorError } from '../../server/repositories'

describe('createReadRepository', () => {
  it('reads only the confirmed normalized catalog tables with fixed SQL', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    await createCatalogRepository({ query } as never).listReferences()

    expect(query).toHaveBeenCalledTimes(21)
    const statements = query.mock.calls.map(([sql]) => String(sql))
    expect(statements.join(' ')).toMatch(/dic_uni_lito_reportada|dic_biozona_normalizada|dic_edad_actualizada/)
    expect(statements.filter(sql => sql.includes('public.cat_'))).toHaveLength(12)
    expect(statements.every(sql => sql.includes('LIMIT $1'))).toBe(true)
    expect(query.mock.calls.every(([, params]) => params?.[0] === 1000)).toBe(true)
    expect(statements.every(sql => !sql.match(/public\."[A-Z_]+"/))).toBe(true)
  })
  it('lists conservation catalogs with lowercase schema names and stable ordering', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const repository = createConservationRepository({ query } as never)

    await repository.listStates()

    expect(query).toHaveBeenCalledTimes(3)
    expect(query).toHaveBeenCalledWith(expect.stringContaining('public.cat_vidrio_estado'))
    expect(query).toHaveBeenCalledWith(expect.stringContaining('public.cat_acetato_estado'))
    expect(query).toHaveBeenCalledWith(expect.stringContaining('public.cat_marco_placa_estado'))
    for (const [sql, params] of query.mock.calls) {
      expect(params).toBeUndefined()
      expect(sql).toMatch(/ORDER BY [a-z_]+_id/)
      expect(sql).not.toMatch(/public\."[A-Z_]+"/)
    }
  })

  it('uses official collection names and parameterized pagination', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ coleccion_id: '7' }] })
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
    const repository = createReadRepository({ query } as never)
    const result = await repository.listCollections(1, 20, 'Geo')
    expect(result).toEqual({ data: [{ coleccion_id: '7' }], total: 3 })
    expect(query).toHaveBeenCalledWith(expect.stringContaining('public.coleccion'), ['Geo', 20, 20])
    expect(query).toHaveBeenCalledWith(expect.stringContaining('count(*)'), ['Geo'])
  })

  it('searches wells by official name or code columns', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
    const repository = createReadRepository({ query } as never)
    await expect(repository.listWells(0, 20, 'A-1')).resolves.toEqual({ data: [], total: 4 })
    expect(query).toHaveBeenCalledWith(expect.stringContaining('p.nombre_pozo ILIKE'), ['A-1', 20, 0])
    expect(query).toHaveBeenCalledWith(expect.stringContaining('p.codigo_pozo ILIKE'), ['A-1', 20, 0])
  })

  it('uses only normalized collection columns for writes', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ coleccion_id: '7' }] })
    const repository = createReadRepository({ query } as never)
    await repository.createCollection({
      codigo_coleccion: 'C-7', nombre_coleccion: 'Colección', institucion: 'SGC',
      responsable_coleccion: 'Persona', descripcion: null, estado_coleccion: 'Activa',
    })
    expect(query).toHaveBeenCalledWith(expect.stringContaining('responsable_coleccion'), ['C-7', 'Colección', 'SGC', 'Persona', null, 'Activa'])
    expect(query.mock.calls[0][0]).not.toContain('responsable,')
  })

  it('updates only the supplied collection fields', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ coleccion_id: '7', nombre_coleccion: 'Nueva' }] })
    const repository = createReadRepository({ query } as never)

    await repository.updateCollection('7', { nombre_coleccion: 'Nueva' })

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('SET nombre_coleccion = $1, updated_at = now()'),
      ['Nueva', '7'],
    )
    expect(query.mock.calls[0][0]).not.toContain('codigo_coleccion =')
    expect(query.mock.calls[0][0]).not.toContain('institucion =')
  })

  it('uses normalized plate columns, joins, and parameterized filters', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ placa_id: '7' }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
    const repository = createReadRepository({ query } as never)
    await expect(repository.listPlates(0, 20, { collectionId: '2', states: ['Validado'], search: 'ABC' })).resolves.toEqual({ data: [{ placa_id: '7' }], total: 1 })
    expect(query).toHaveBeenCalledWith(expect.stringContaining('public.placa'), ['ABC', '2', ['Validado'], 20, 0])
    expect(query.mock.calls[0][0]).toContain('cat_estado_catalogacion')
    expect(query.mock.calls[0][0]).not.toContain('ubicacion_id')
  })

  it('reads samples from MUESTRA and its normalized subsurface relation', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ muestra_id: '9' }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
    const repository = createReadRepository({ query } as never)
    await expect(repository.listSamples(1, 10)).resolves.toEqual({ data: [{ muestra_id: '9' }], total: 1 })
    expect(query).toHaveBeenCalledWith(expect.stringContaining('public.muestra_subsuelo'), [10, 10])
  })

  it('reads physical locations through normalized tray, section and column relations', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ ubicacion_fisica_id: '9' }] })
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
    const repository = createReadRepository({ query } as never)
    await expect(repository.listPhysicalLocations(1, 10, { search: 'A', occupied: false, sectionId: '3' })).resolves.toEqual({ data: [{ ubicacion_fisica_id: '9' }], total: 2 })
    expect(query).toHaveBeenCalledWith(expect.stringContaining('public.ubicacion_fisica'), ['A', false, '3', 10, 10])
    expect(query.mock.calls[0][0]).toContain('public.zona_mueble')
    expect(query.mock.calls[0][0]).toContain('public.cat_seccion')
    expect(query.mock.calls[0][0]).not.toMatch(/mueble_cod|ocupada|no_bandeja/)
  })

  it('resolves active users by ad_username, never by correo', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const roles = createRoleRepository({ query } as never)

    await roles.findActiveUserByLogin('adrian')

    expect(query).toHaveBeenCalledWith(expect.stringContaining('lower(p.ad_username) = lower($1)'), ['adrian'])
    expect(query.mock.calls[0][0]).not.toMatch(/lower\(p\.correo\)/)
  })

  it('never emits quoted identifiers for tables created unquoted in schema.sql', async () => {
    const query = vi.fn()
      .mockResolvedValue({ rows: [] })
    const repository = createReadRepository({ query } as never)
    const roles = createRoleRepository({ query } as never)

    await roles.findActiveUserByLogin('user@example.test')
    await repository.listCollections(0, 20)
    await repository.listWells(0, 20)
    await repository.listBasins()
    await repository.listPlates(0, 20, {})
    await repository.listSamples(0, 20)
    await repository.getCollection('1')
    await repository.getWell('1')
    await repository.getPlate('1')
    await repository.getSample('1')
    await repository.listPhysicalLocations(0, 20, {})
    await repository.getPhysicalLocation('1')
    await repository.createCollection({
      codigo_coleccion: null,
      nombre_coleccion: 'Test',
      institucion: null,
      responsable_coleccion: null,
      descripcion: null,
      estado_coleccion: null,
    })
    await repository.updateCollection('1', { nombre_coleccion: 'Updated' })
    await repository.deleteCollection('1')

    for (const [sql] of query.mock.calls) {
      expect(sql).not.toMatch(/public\."[A-Z_]+"/)
    }
  })

  it('aggregates dashboard reads from normalized tables with parameters', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ totalPlacas: 2, totalMuestras: 3, placasValidadas: 1, ubicacionesDisponibles: 4 }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Validado', value: 2 }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Sección A', total: 2, ocupadas: 1, ocupacion: 50 }] })
      .mockResolvedValueOnce({ rows: [{ placa_id: '8', nivel: 'CRÍTICA' }] })
    const repository = createReadRepository({ query } as never)

    await expect(repository.getDashboard()).resolves.toEqual({
      kpis: { totalPlacas: 2, totalMuestras: 3, placasValidadas: 50, ubicacionesDisponibles: 4 },
      estadoCatalogacion: [{ name: 'Validado', value: 2 }],
      ocupacion: [{ name: 'Sección A', total: 2, ocupadas: 1, ocupacion: 50 }],
      actividadReciente: [],
      problemasConservacion: [{ placa_id: '8', nivel: 'CRÍTICA' }],
    })
    expect(query.mock.calls.some(([sql]) => sql.includes('public.estado_conservacion_inicial'))).toBe(true)
    expect(query.mock.calls.some(([sql]) => sql.includes('public.auditoria'))).toBe(false)
    for (const [sql] of query.mock.calls) expect(sql).not.toMatch(/mueble_cod|auditoria_cambios/)
  })
})

describe('createAdminRepository', () => {
  it('rolls back an attempt to remove the last administrator', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // advisory lock
      .mockResolvedValueOnce({ rows: [{ persona_id: '1' }] })
      .mockResolvedValueOnce({}) // update persona
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({}) // ROLLBACK
    const client = { query, release: vi.fn() }
    const repository = createAdminRepository({ connect: vi.fn().mockResolvedValue(client) } as never)

    await expect(repository.updatePerson('1', { activo: false })).rejects.toBeInstanceOf(LastAdministratorError)
    expect(query).toHaveBeenCalledWith(expect.stringContaining('pg_advisory_xact_lock'), [19478231])
    expect(query).toHaveBeenCalledWith('ROLLBACK')
    expect(client.release).toHaveBeenCalledOnce()
  })

  it('preserves unchanged role assignments and only closes removed roles', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ persona_id: '1' }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ rol_id: '2' }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ persona_id: '1', roles: [{ rol_id: '2', nombre: 'Administrador' }] }] })
      .mockResolvedValueOnce({})
    const client = { query, release: vi.fn() }
    const repository = createAdminRepository({ connect: vi.fn().mockResolvedValue(client) } as never)

    await repository.updatePerson('1', { role_ids: ['2'] })
    const updateSql = query.mock.calls.find(([sql]) => String(sql).includes('UPDATE public.rel_persona_rol'))?.[0]
    expect(updateSql).toContain('rol_id <> ALL($2::bigint[])')
    expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE public.rel_persona_rol'), ['1', ['2']])
    const insertSql = query.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO public.rel_persona_rol'))?.[0]
    expect(insertSql).toContain('NOT EXISTS')
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO public.rel_persona_rol'), [['2'], '1'])
    expect(query.mock.calls.every(([sql]) => !String(sql).match(/public\."[A-Z_]+"/))).toBe(true)
  })

  it('removes all active assignments when no roles remain', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ persona_id: '1' }] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ persona_id: '1', roles: [] }] })
      .mockResolvedValueOnce({})
    const client = { query, release: vi.fn() }
    const repository = createAdminRepository({ connect: vi.fn().mockResolvedValue(client) } as never)

    await repository.updatePerson('1', { role_ids: [] })

    expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE public.rel_persona_rol'), ['1', []])
    expect(query.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO public.rel_persona_rol'))).toBe(false)
  })
})

describe('createSessionRepository', () => {
  it('purges expired sessions before storing a new one', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const repository = createSessionRepository({ query } as never)

    await repository.create('hash', { personaId: '1', username: 'adrian', name: 'Adrian', roles: ['Administrador'] }, new Date('2026-01-01T00:00:00Z'))

    const statements = query.mock.calls.map(([sql]) => String(sql))
    expect(statements[0]).toContain('DELETE FROM app_auth_sessions WHERE expires_at <= now()')
    expect(statements[1]).toContain('INSERT INTO app_auth_sessions')
    expect(query.mock.calls[1][1]).toEqual(['hash', '1', 'adrian', 'Adrian', ['Administrador'], new Date('2026-01-01T00:00:00Z')])
  })
})
