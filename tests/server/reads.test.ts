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
