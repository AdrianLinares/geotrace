import { describe, expect, it, vi } from 'vitest'
import { createReadRepository } from '../../server/repositories'

describe('createReadRepository', () => {
  it('uses official collection names and parameterized pagination', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ coleccion_id: '7' }] })
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
    const repository = createReadRepository({ query } as never)
    const result = await repository.listCollections(1, 20, 'Geo')
    expect(result).toEqual({ data: [{ coleccion_id: '7' }], total: 3 })
    expect(query).toHaveBeenCalledWith(expect.stringContaining('public."COLECCION"'), ['Geo', 20, 20])
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
})
