import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createApp } from '../../server/app'
import type { AppConfig } from '../../server/config'
import type { PlateRepository } from '../../server/types'

const config: AppConfig = { NODE_ENV: 'test', SERVER_HOST: '127.0.0.1', SERVER_PORT: 3000, DATABASE_URL: 'postgres://test', LDAP_URL: 'ldaps://directory.test', LDAP_STARTTLS: false, LDAP_BASE_DN: 'dc=test', LDAP_USER_SEARCH_FILTER: '(uid={{username}})', SESSION_COOKIE_NAME: 'geotrace_session', SESSION_TTL_SECONDS: 60, SESSION_COOKIE_SAME_SITE: 'lax', SESSION_COOKIE_SECURE: false, SESSION_COOKIE_DOMAIN: undefined }
const catalogador = { personaId: '1', username: 'catalogador@test', name: 'Catalogador', roles: ['Catalogador'] }
const revisor = { personaId: '2', username: 'revisor@test', name: 'Revisor', roles: ['Revisor'] }
const sample = { muestra_id: '7', catalogador_id: '1' }
const makeReads = (overrides: Partial<PlateRepository> = {}) => ({
  listCollections: vi.fn(), getCollection: vi.fn(), listWells: vi.fn(), getWell: vi.fn(), listBasins: vi.fn(), createCollection: vi.fn(), updateCollection: vi.fn(), deleteCollection: vi.fn(), listPlates: vi.fn(), getPlate: vi.fn(), listSamples: vi.fn(), getSample: vi.fn().mockResolvedValue(sample), listPhysicalLocations: vi.fn(), getPhysicalLocation: vi.fn(), getDashboard: vi.fn(),
  createPlate: vi.fn(), updatePlate: vi.fn(), transitionPlate: vi.fn(), createSample: vi.fn().mockResolvedValue(sample), updateSample: vi.fn().mockResolvedValue(sample), deleteSample: vi.fn().mockResolvedValue(true),
  ...overrides,
}) as unknown as PlateRepository
const authFor = (user: unknown) => ({ restore: vi.fn().mockResolvedValue(user) }) as never

afterEach(() => vi.clearAllMocks())

describe('sample write routes', () => {
  it('does not retain legacy writes in the modal', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/pages/muestras/MuestraModal.tsx'), 'utf8')
    expect(source).not.toMatch(/supabase\.from|muestra_empresa|disposicion_material|estado_conservacion_inicial|['"]geologia['"]|['"]microfauna['"]|['"]empresas['"]|['"]disposicion['"]|['"]conservacion['"]|['"]placa_id['"]$/)
  })

  it('requires authentication and a cataloging role to create', async () => {
    const reads = makeReads()
    const unauthenticated = await createApp({ auth: authFor(null), config, reads })
    expect((await unauthenticated.inject({ method: 'POST', url: '/api/samples', payload: { nombre_muestra_original: 'A' } })).statusCode).toBe(401)
    await unauthenticated.close()

    const forbidden = await createApp({ auth: authFor(revisor), config, reads })
    expect((await forbidden.inject({ method: 'POST', url: '/api/samples', payload: { nombre_muestra_original: 'A' } })).statusCode).toBe(403)
    expect(reads.createSample).not.toHaveBeenCalled()
    await forbidden.close()
  })

  it('strictly validates the base whitelist and assigns authenticated ownership', async () => {
    const reads = makeReads()
    const app = await createApp({ auth: authFor(catalogador), config, reads })
    expect((await app.inject({ method: 'POST', url: '/api/samples', payload: { placa_id: 'invented' } })).statusCode).toBe(400)
    expect((await app.inject({ method: 'POST', url: '/api/samples', payload: { nombre_muestra_original: 'A' } })).statusCode).toBe(201)
    expect(reads.createSample).toHaveBeenCalledWith(expect.objectContaining({ catalogador_id: '1', fecha_ingreso: expect.any(String) }))
    await app.close()
  })

  it('enforces catalogador ownership and reviewer-only fields on update', async () => {
    const reads = makeReads({ getSample: vi.fn().mockResolvedValue({ ...sample, catalogador_id: '99' }) })
    const app = await createApp({ auth: authFor(catalogador), config, reads })
    expect((await app.inject({ method: 'PUT', url: '/api/samples/7', payload: { observaciones: 'forged' } })).statusCode).toBe(403)
    expect(reads.updateSample).not.toHaveBeenCalled()
    await app.close()

    const reviewerApp = await createApp({ auth: authFor(revisor), config, reads: makeReads() })
    expect((await reviewerApp.inject({ method: 'PUT', url: '/api/samples/7', payload: { revisor_id: '2' } })).statusCode).toBe(200)
    await reviewerApp.close()
  })

  it('restricts deletes to curators and administrators', async () => {
    const reads = makeReads()
    const app = await createApp({ auth: authFor(catalogador), config, reads })
    expect((await app.inject({ method: 'DELETE', url: '/api/samples/7' })).statusCode).toBe(403)
    expect(reads.deleteSample).not.toHaveBeenCalled()
    await app.close()

    const curator = { ...catalogador, roles: ['Curador'] }
    const allowed = await createApp({ auth: authFor(curator), config, reads })
    expect((await allowed.inject({ method: 'DELETE', url: '/api/samples/7' })).statusCode).toBe(200)
    expect(reads.deleteSample).toHaveBeenCalledWith('7')
    await allowed.close()
  })
})
