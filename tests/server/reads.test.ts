import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../server/app'
import type { AppConfig } from '../../server/config'
import type { ReadRepository } from '../../server/types'

const config: AppConfig = {
  NODE_ENV: 'test', SERVER_HOST: '127.0.0.1', SERVER_PORT: 3000, DATABASE_URL: 'postgres://test',
  LDAP_URL: 'ldaps://directory.test', LDAP_STARTTLS: false, LDAP_BASE_DN: 'dc=test',
  LDAP_USER_SEARCH_FILTER: '(uid={{username}})', SESSION_COOKIE_NAME: 'geotrace_session', SESSION_TTL_SECONDS: 60,
  SESSION_COOKIE_SAME_SITE: 'lax', SESSION_COOKIE_SECURE: false, SESSION_COOKIE_DOMAIN: undefined,
}

const user = { personaId: '1', username: 'user@test', name: 'Test User', roles: ['Catalogador'] }
const reads: ReadRepository = {
  listCollections: vi.fn().mockResolvedValue({ data: [{ coleccion_id: '1' }], total: 1 }),
  getCollection: vi.fn().mockResolvedValue(null),
  listWells: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getWell: vi.fn().mockResolvedValue(null),
  listBasins: vi.fn().mockResolvedValue([{ cuenca_id: '1', nombre_cuenca: 'Llanos' }]),
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  listPlates: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getPlate: vi.fn().mockResolvedValue(null),
  listSamples: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getSample: vi.fn().mockResolvedValue(null),
  listPhysicalLocations: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getPhysicalLocation: vi.fn().mockResolvedValue(null),
  getDashboard: vi.fn().mockResolvedValue({ kpis: {}, estadoCatalogacion: [], ocupacion: [], actividadReciente: [], problemasConservacion: [] }),
}

afterEach(() => vi.clearAllMocks())

describe('authenticated read routes', () => {
  it('rejects unauthenticated reads', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(null) } as never, config, reads })
    const response = await app.inject({ method: 'GET', url: '/api/collections' })
    expect(response.statusCode).toBe(401)
    expect(reads.listCollections).not.toHaveBeenCalled()
    await app.close()
  })

  it('passes session, pagination and search to the repository', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(user) } as never, config, reads })
    const response = await app.inject({ method: 'GET', url: '/api/collections?page=2&pageSize=10&search=rock' })
    expect(response.statusCode).toBe(200)
    expect(reads.listCollections).toHaveBeenCalledWith(2, 10, 'rock')
    await app.close()
  })

  it('exposes only confirmed reference catalogs', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(user) } as never, config, reads })
    const response = await app.inject({ method: 'GET', url: '/api/reference/basins' })
    expect(response.statusCode).toBe(200)
    expect(reads.listBasins).toHaveBeenCalledOnce()
    await app.close()
  })

  it('protects and validates normalized plate and sample reads', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(user) } as never, config, reads })
    vi.mocked(reads.getPlate).mockResolvedValue({ placa_id: '4' } as never)
    vi.mocked(reads.getSample).mockResolvedValue({ muestra_id: '8' } as never)
    const plates = await app.inject({ method: 'GET', url: '/api/plates?page=1&collectionId=4&states=Validado,En%20revision&search=ABC' })
    expect(plates.statusCode).toBe(200)
    expect(reads.listPlates).toHaveBeenCalledWith(1, 20, { collectionId: '4', states: ['Validado', 'En revision'], search: 'ABC' })

    expect((await app.inject({ method: 'GET', url: '/api/plates/4' })).statusCode).toBe(200)
    expect((await app.inject({ method: 'GET', url: '/api/samples/8' })).statusCode).toBe(200)
    expect(reads.getPlate).toHaveBeenCalledWith('4')
    expect(reads.getSample).toHaveBeenCalledWith('8')

    const invalid = await app.inject({ method: 'GET', url: '/api/plates/0' })
    const unsupported = await app.inject({ method: 'GET', url: '/api/samples?placaId=4' })
    expect(invalid.statusCode).toBe(400)
    expect(unsupported.statusCode).toBe(400)
    expect(reads.listSamples).not.toHaveBeenCalled()
    await app.close()
  })

  it('protects and returns the aggregated dashboard read', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(user) } as never, config, reads })
    const response = await app.inject({ method: 'GET', url: '/api/dashboard' })
    expect(response.statusCode).toBe(200)
    expect(reads.getDashboard).toHaveBeenCalledOnce()
    await app.close()
  })

  it('returns 401 for the dashboard without a session', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(null) } as never, config, reads })
    const response = await app.inject({ method: 'GET', url: '/api/dashboard' })
    expect(response.statusCode).toBe(401)
    expect(reads.getDashboard).not.toHaveBeenCalled()
    await app.close()
  })

  it('protects, validates and routes physical-location reads', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(user) } as never, config, reads })
    const response = await app.inject({ method: 'GET', url: '/api/physical-locations?page=2&occupied=false&search=SE-1' })
    expect(response.statusCode).toBe(200)
    expect(reads.listPhysicalLocations).toHaveBeenCalledWith(2, 20, { search: 'SE-1', occupied: false, sectionId: undefined })
    expect((await app.inject({ method: 'GET', url: '/api/physical-locations/0' })).statusCode).toBe(400)
    expect((await app.inject({ method: 'GET', url: '/api/physical-locations?occupied=invalid' })).statusCode).toBe(400)
    await app.close()
  })

  it('protects collection mutations with the session', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(null) } as never, config, reads })
    const response = await app.inject({ method: 'POST', url: '/api/collections', payload: { nombre_coleccion: 'Nueva' } })
    expect(response.statusCode).toBe(401)
    expect(reads.createCollection).not.toHaveBeenCalled()
    await app.close()
  })

  it('routes authenticated collection mutations to the repository', async () => {
    vi.mocked(reads.createCollection).mockResolvedValue({
      coleccion_id: '2', codigo_coleccion: null, nombre_coleccion: 'Nueva', institucion: null,
      responsable_coleccion: null, descripcion: null, estado_coleccion: 'Activa',
    })
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(user) } as never, config, reads })
    const response = await app.inject({ method: 'POST', url: '/api/collections', payload: { nombre_coleccion: 'Nueva' } })
    expect(response.statusCode).toBe(201)
    expect(reads.createCollection).toHaveBeenCalledWith({
      codigo_coleccion: null, nombre_coleccion: 'Nueva', institucion: null,
      responsable_coleccion: null, descripcion: null, estado_coleccion: null,
    })
    await app.close()
  })

  it('validates collection updates and deletes', async () => {
    vi.mocked(reads.updateCollection).mockResolvedValue({
      coleccion_id: '2', codigo_coleccion: null, nombre_coleccion: 'Actualizada', institucion: null,
      responsable_coleccion: null, descripcion: null, estado_coleccion: 'Activa',
    })
    vi.mocked(reads.deleteCollection).mockResolvedValue(true)
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(user) } as never, config, reads })

    const update = await app.inject({
      method: 'PUT', url: '/api/collections/2',
      payload: { nombre_coleccion: 'Actualizada', estado_coleccion: 'Activa' },
    })
    expect(update.statusCode).toBe(200)
    expect(reads.updateCollection).toHaveBeenCalledWith('2', { nombre_coleccion: 'Actualizada', estado_coleccion: 'Activa' })

    const deleteResponse = await app.inject({ method: 'DELETE', url: '/api/collections/2' })
    expect(deleteResponse.statusCode).toBe(200)
    expect(reads.deleteCollection).toHaveBeenCalledWith('2')
    await app.close()
  })

  it('returns 400 for invalid collection payloads and route parameters', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue(user) } as never, config, reads })
    const extraField = await app.inject({ method: 'PUT', url: '/api/collections/2', payload: { nombre_coleccion: 'Valid name', unexpected: true } })
    const invalidId = await app.inject({ method: 'DELETE', url: '/api/collections/%20' })
    const invalidPagination = await app.inject({ method: 'GET', url: '/api/wells?page=-1' })
    const invalidBasinQuery = await app.inject({ method: 'GET', url: '/api/reference/basins?unexpected=true' })

    expect(extraField.statusCode).toBe(400)
    expect(invalidId.statusCode).toBe(400)
    expect(invalidPagination.statusCode).toBe(400)
    expect(invalidBasinQuery.statusCode).toBe(400)
    expect(reads.updateCollection).not.toHaveBeenCalled()
    await app.close()
  })
})
