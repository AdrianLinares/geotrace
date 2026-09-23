import { describe, expect, it, vi } from 'vitest'
import { createReadRepository, createRoleRepository } from '../../server/repositories'

describe('createReadRepository', () => {
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

  it('never emits quoted identifiers for tables created unquoted in schema.sql', async () => {
    const query = vi.fn()
      .mockResolvedValue({ rows: [] })
    const repository = createReadRepository({ query } as never)
    const roles = createRoleRepository({ query } as never)

    await roles.findActiveUserByUsername('user@example.test')
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
})
