import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { provisionLocalAdmin } from '../../scripts/manage-local-admin'

type QueryResult = { rows: Array<Record<string, string>> }

describe('local admin provisioning', () => {
  it('does not persist anything when Administrador is missing', async () => {
    const queries: string[] = []
    const client = {
      async query(text: string): Promise<QueryResult> {
        queries.push(text)
        return { rows: [] }
      },
    }

    await expect(provisionLocalAdmin(client, 'local-admin', 'scrypt$16384$8$1$' + 'a'.repeat(32) + '$' + 'b'.repeat(128)))
      .rejects.toThrow(/Administrador does not exist/)
    expect(queries).toHaveLength(1)
    expect(queries[0]).toMatch(/FROM public\.cat_rol/)
    expect(queries.some(query => /INSERT INTO/i.test(query))).toBe(false)
  })

  it('revokes existing sessions after rotating the local credential', async () => {
    const calls: Array<{ text: string; params?: unknown[] }> = []
    const responses = [
      { rows: [{ roleId: '4' }] },          // cat_rol lookup
      { rows: [{ personaId: '1' }] },       // persona upsert
      { rows: [] },                          // credential upsert
      { rows: [] },                          // session revocation
      { rows: [{ rol_id: '4' }] },          // role assignment insert
      { rows: [] },                          // effective assignment check
    ]
    const client = {
      async query(text: string, params?: unknown[]): Promise<QueryResult> {
        calls.push({ text, params })
        return responses.shift() ?? { rows: [] }
      },
    }

    await provisionLocalAdmin(client, 'local-admin', 'scrypt$16384$8$1$' + 'a'.repeat(32) + '$' + 'b'.repeat(128))

    const revocation = calls.find(call => /DELETE FROM public\.app_auth_sessions/.test(call.text))
    expect(revocation?.params).toEqual(['1'])
    const revocationIndex = calls.findIndex(call => /DELETE FROM public\.app_auth_sessions/.test(call.text))
    const credentialIndex = calls.findIndex(call => /INSERT INTO public\.app_local_admin_credentials/.test(call.text))
    expect(revocationIndex).toBeGreaterThan(credentialIndex)
  })

  it('requires the exact generated scrypt hash format in the migration', async () => {
    const migration = await readFile(resolve(process.cwd(), 'sql/migrations/002_local_admin_credentials.sql'), 'utf8')
    expect(migration).toContain('app_local_admin_credentials_password_hash_format')
    expect(migration).toContain("'^scrypt\\$16384\\$8\\$1\\$[0-9a-fA-F]{32}\\$[0-9a-fA-F]{128}$'")
  })
})
