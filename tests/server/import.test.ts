import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../../server/app'
import { createImportRepository } from '../../server/repositories'
import type { AppConfig } from '../../server/config'
import type { ImportRepository } from '../../server/types'

const config: AppConfig = {
  NODE_ENV: 'test', SERVER_HOST: '127.0.0.1', SERVER_PORT: 3000, DATABASE_URL: 'postgres://test',
  LDAP_URL: 'ldaps://directory.test', LDAP_STARTTLS: false, LDAP_BASE_DN: 'dc=test',
  LDAP_USER_SEARCH_FILTER: '(uid={{username}})', SESSION_COOKIE_NAME: 'session', SESSION_TTL_SECONDS: 60,
  SESSION_COOKIE_SAME_SITE: 'lax', SESSION_COOKIE_SECURE: false, SESSION_COOKIE_DOMAIN: undefined,
}
const row = { codigo_coleccion: 'COL-1' }
const repository: ImportRepository = { importBatches: vi.fn().mockResolvedValue(1) }

describe('local administrator imports', () => {
  it('requires authentication and the Administrador role', async () => {
    const unauthenticated = await createApp({ auth: { restore: vi.fn().mockResolvedValue(null) } as never, config, imports: repository })
    expect((await unauthenticated.inject({ method: 'POST', url: '/api/admin/import', payload: { batches: [{ table: 'coleccion', rows: [row] }] } })).statusCode).toBe(401)
    await unauthenticated.close()

    const forbidden = await createApp({ auth: { restore: vi.fn().mockResolvedValue({ roles: ['Catalogador'] }) } as never, config, imports: repository })
    expect((await forbidden.inject({ method: 'POST', url: '/api/admin/import', payload: { batches: [{ table: 'coleccion', rows: [row] }] } })).statusCode).toBe(403)
    expect(repository.importBatches).not.toHaveBeenCalled()
    await forbidden.close()
  })

  it('rejects arbitrary tables and oversized batches before the repository', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue({ roles: ['Administrador'] }) } as never, config, imports: repository })
    expect((await app.inject({ method: 'POST', url: '/api/admin/import', payload: { batches: [{ table: 'mueble', rows: [row] }] } })).statusCode).toBe(400)
    expect((await app.inject({ method: 'POST', url: '/api/admin/import', payload: { batches: [{ table: 'coleccion', rows: Array.from({ length: 1001 }, () => row) }] } })).statusCode).toBe(400)
    expect(repository.importBatches).not.toHaveBeenCalled()
    await app.close()
  })

  it('rejects import bodies over the byte limit', async () => {
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue({ roles: ['Administrador'] }) } as never, config, imports: repository })
    const response = await app.inject({ method: 'POST', url: '/api/admin/import', payload: { batches: [{ table: 'coleccion', rows: [{ descripcion: 'x'.repeat(1_000_001) }] }] } })
    expect(response.statusCode).toBe(413)
    await app.close()
  })

  it('uses a fixed whitelist and rolls back the whole batch on failure', async () => {
    const invalidPool = { connect: vi.fn() } as never
    await expect(createImportRepository(invalidPool).importBatches([{ table: 'coleccion', rows: [{ codigo_coleccion: 'COL-1', unexpected: 'rejected' }] }])).rejects.toThrow()
    const client = { query: vi.fn(), release: vi.fn() }
    client.query.mockResolvedValueOnce({}).mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: '23505' }))
    const pool = { connect: vi.fn().mockResolvedValue(client) } as never
    const imports = createImportRepository(pool)
    await expect(imports.importBatches([{ table: 'coleccion', rows: [{ codigo_coleccion: 'COL-1' }] }])).rejects.toThrow()
    expect(client.query).toHaveBeenCalledWith('ROLLBACK')
    const insert = client.query.mock.calls.find(([sql]) => String(sql).startsWith('INSERT'))?.[0] as string
    expect(insert).toContain('public.coleccion')
    expect(insert).toContain('codigo_coleccion')
    expect(insert).not.toContain('unexpected')
    expect(client.query).not.toHaveBeenCalledWith(expect.stringContaining('mueble'))
    expect(client.release).toHaveBeenCalledOnce()
  })

  it('rolls back inserts across all table batches when a later table fails', async () => {
    const client = { query: vi.fn(), release: vi.fn() }
    client.query.mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(Object.assign(new Error('reference failure'), { code: '23503' }))
    const pool = { connect: vi.fn().mockResolvedValue(client) } as never
    const imports = createImportRepository(pool)

    await expect(imports.importBatches([
      { table: 'coleccion', rows: [{ codigo_coleccion: 'COL-1' }] },
      { table: 'pozo', rows: [{ codigo_pozo: 'POZ-1' }] },
    ])).rejects.toThrow()
    expect(client.query).toHaveBeenCalledWith('BEGIN')
    expect(client.query).toHaveBeenCalledWith('ROLLBACK')
    expect(client.query).not.toHaveBeenCalledWith('COMMIT')
  })

  it('rejects empty rows before acquiring a database client', async () => {
    const importBatches = vi.fn()
    const app = await createApp({ auth: { restore: vi.fn().mockResolvedValue({ roles: ['Administrador'] }) } as never, config, imports: { importBatches } })
    const response = await app.inject({ method: 'POST', url: '/api/admin/import', payload: { batches: [{ table: 'coleccion', rows: [{}, { codigo_coleccion: '   ' }] }] } })
    expect(response.statusCode).toBe(400)
    expect(importBatches).not.toHaveBeenCalled()
    await app.close()
  })
})
