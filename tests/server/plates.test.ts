import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../server/app'
import { createReadRepository, InvalidPlateTransitionError, PlateAuthorizationError } from '../../server/repositories'
import type { AppConfig } from '../../server/config'
import type { PlateRepository } from '../../server/types'

const config: AppConfig = { NODE_ENV: 'test', SERVER_HOST: '127.0.0.1', SERVER_PORT: 3000, DATABASE_URL: 'postgres://test', LDAP_URL: 'ldaps://directory.test', LDAP_STARTTLS: false, LDAP_BASE_DN: 'dc=test', LDAP_USER_SEARCH_FILTER: '(uid={{username}})', SESSION_COOKIE_NAME: 'geotrace_session', SESSION_TTL_SECONDS: 60, SESSION_COOKIE_SAME_SITE: 'lax', SESSION_COOKIE_SECURE: false, SESSION_COOKIE_DOMAIN: undefined }
const plate = { placa_id: '7' }
const baseReads = { listCollections: vi.fn(), getCollection: vi.fn(), listWells: vi.fn(), getWell: vi.fn(), listBasins: vi.fn(), createCollection: vi.fn(), updateCollection: vi.fn(), deleteCollection: vi.fn(), listPlates: vi.fn(), getPlate: vi.fn(), listSamples: vi.fn(), getSample: vi.fn(), listPhysicalLocations: vi.fn(), getPhysicalLocation: vi.fn(), getDashboard: vi.fn() }
const makeReads = (overrides: Partial<PlateRepository> = {}) => ({ ...baseReads, createPlate: vi.fn().mockResolvedValue(plate), updatePlate: vi.fn().mockResolvedValue(plate), transitionPlate: vi.fn().mockResolvedValue(plate), ...overrides }) as unknown as PlateRepository
const authFor = (user: unknown) => ({ restore: vi.fn().mockResolvedValue(user) }) as never
const catalogador = { personaId: '1', username: 'catalogador@test', name: 'Catalogador', roles: ['Catalogador'] }
const revisor = { personaId: '2', username: 'revisor@test', name: 'Revisor', roles: ['Revisor'] }

afterEach(() => vi.clearAllMocks())

describe('plate write routes', () => {
  it('returns 401 and 403 before invoking the repository', async () => {
    const reads = makeReads()
    const unauthenticated = await createApp({ auth: authFor(null), config, reads })
    expect((await unauthenticated.inject({ method: 'POST', url: '/api/plates', payload: {} })).statusCode).toBe(401)
    await unauthenticated.close()
    const forbidden = await createApp({ auth: authFor({ ...catalogador, roles: ['Revisor'] }), config, reads })
    expect((await forbidden.inject({ method: 'POST', url: '/api/plates', payload: { codigo_placa: 'P-1' } })).statusCode).toBe(403)
    expect(reads.createPlate).not.toHaveBeenCalled()
    await forbidden.close()
  })

  it('rejects unknown fields and creates/updates only through the local API', async () => {
    const reads = makeReads({ getPlate: vi.fn().mockResolvedValue({ ...plate, catalogador_id: '1' }) })
    const app = await createApp({ auth: authFor(catalogador), config, reads })
    expect((await app.inject({ method: 'POST', url: '/api/plates', payload: { ubicacion_id: 'invented' } })).statusCode).toBe(400)
    expect((await app.inject({ method: 'POST', url: '/api/plates', payload: { codigo_placa: 'P-1' } })).statusCode).toBe(201)
    expect((await app.inject({ method: 'PUT', url: '/api/plates/7', payload: { observaciones: 'ok' } })).statusCode).toBe(200)
    expect((await app.inject({ method: 'PUT', url: '/api/plates/7', payload: { estado_catalogacion_id: '2' } })).statusCode).toBe(400)
    expect(reads.createPlate).toHaveBeenCalledWith(expect.objectContaining({ catalogador_id: '1' }))
    expect(reads.updatePlate).toHaveBeenCalledWith('7', { observaciones: 'ok' }, catalogador)
    await app.close()
  })

  it('returns 403 when a catalogador edits another catalogador plate', async () => {
    const reads = makeReads({ getPlate: vi.fn().mockResolvedValue({ ...plate, catalogador_id: '99' }) })
    const app = await createApp({ auth: authFor(catalogador), config, reads })

    const response = await app.inject({ method: 'PUT', url: '/api/plates/7', payload: { observaciones: 'forged' } })

    expect(response.statusCode).toBe(403)
    expect(reads.updatePlate).not.toHaveBeenCalled()
    await app.close()
  })

  it('always assigns the authenticated catalogador when creating a plate', async () => {
    const reads = makeReads()
    const app = await createApp({ auth: authFor(catalogador), config, reads })

    const response = await app.inject({ method: 'POST', url: '/api/plates', payload: { codigo_placa: 'P-1', catalogador_id: '99' } })

    expect(response.statusCode).toBe(201)
    expect(reads.createPlate).toHaveBeenCalledWith(expect.objectContaining({ catalogador_id: '1' }))
    await app.close()
  })

  it('requires reviewer authorization for review fields and maps transition authorization errors to 403', async () => {
    const reads = makeReads({ transitionPlate: vi.fn().mockRejectedValue(new PlateAuthorizationError('Catalogador can only transition owned plates')) })
    const app = await createApp({ auth: authFor(catalogador), config, reads })
    expect((await app.inject({ method: 'PUT', url: '/api/plates/7', payload: { estado_revision_id: '2' } })).statusCode).toBe(403)
    expect((await app.inject({ method: 'POST', url: '/api/plates/7/status', payload: { estado_catalogacion_id: '3' } })).statusCode).toBe(403)
    expect(reads.transitionPlate).toHaveBeenCalledWith('7', '3', catalogador)
    await app.close()
  })

  it('allows a revisor to edit ordinary plate fields', async () => {
    const reads = makeReads({ getPlate: vi.fn().mockResolvedValue({ ...plate, catalogador_id: '1' }) })
    const app = await createApp({ auth: authFor(revisor), config, reads })

    const response = await app.inject({ method: 'PUT', url: '/api/plates/7', payload: { observaciones: 'reviewed' } })

    expect(response.statusCode).toBe(200)
    expect(reads.updatePlate).toHaveBeenCalledWith('7', { observaciones: 'reviewed' }, revisor)
    await app.close()
  })
})

describe('plate transaction boundary', () => {
  it('rejects a catalogador transition on another catalogador plate and rolls back', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ estado: 'En proceso', catalogador_id: '99' }] })
      .mockResolvedValueOnce({ rows: [{ estado: 'Incompleto' }] })
    const client = { query, release: vi.fn() }
    const repository = createReadRepository({ query: vi.fn(), connect: vi.fn().mockResolvedValue(client) } as never)

    await expect(repository.transitionPlate('7', '5', catalogador)).rejects.toBeInstanceOf(PlateAuthorizationError)
    expect(query).toHaveBeenCalledWith('BEGIN')
    expect(query.mock.calls[1][0]).toContain('FOR UPDATE')
    expect(query).toHaveBeenCalledWith('ROLLBACK')
    expect(query.mock.calls.flat().join(' ')).not.toContain('UPDATE public.placa')
  })

  it.each([
    ['Catalogador', catalogador, 'En proceso', 'Incompleto'],
    ['Revisor', revisor, 'En proceso', 'En revisión'],
    ['Curador', { ...revisor, roles: ['Curador'] }, 'En proceso', 'Incompleto'],
    ['Administrador', { ...revisor, roles: ['Administrador'] }, 'En proceso', 'Incompleto'],
  ])('allows %s to transition when permitted', async (_role, user, currentState, targetState) => {
    const query = vi.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ estado: currentState, catalogador_id: '1' }] })
      .mockResolvedValueOnce({ rows: [{ estado: targetState }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ placa_id: '7' }] })
    const client = { query, release: vi.fn() }
    const repository = createReadRepository({ query: vi.fn(), connect: vi.fn().mockResolvedValue(client) } as never)

    await expect(repository.transitionPlate('7', '5', user)).resolves.toEqual({ placa_id: '7' })
    expect(query).toHaveBeenCalledWith('COMMIT')
  })

  it('rolls back when the state is invalid and never writes audit to a missing table', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ estado: 'En proceso' }] })
      .mockResolvedValueOnce({ rows: [{ estado: 'Cerrado' }] })
    const client = { query, release: vi.fn() }
    const repository = createReadRepository({ query: vi.fn(), connect: vi.fn().mockResolvedValue(client) } as never)
    await expect(repository.transitionPlate('7', '5', catalogador)).rejects.toBeInstanceOf(InvalidPlateTransitionError)
    expect(query).toHaveBeenCalledWith('BEGIN')
    expect(query).toHaveBeenCalledWith('ROLLBACK')
    expect(query.mock.calls.flat().join(' ')).not.toContain('auditoria_cambios')
  })
})
