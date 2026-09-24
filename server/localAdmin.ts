import type { Pool } from 'pg'
import type { LocalCredentialRepository } from './types'

export function createLocalCredentialRepository(pool: Pool): LocalCredentialRepository {
  return {
    async findByUsername(username) {
      const result = await pool.query<{ passwordHash: string }>(
        `SELECT password_hash AS "passwordHash"
           FROM public.app_local_admin_credentials
          WHERE lower(username) = lower($1) AND enabled = true`, [username],
      )
      return result.rows[0] ?? null
    },
  }
}
