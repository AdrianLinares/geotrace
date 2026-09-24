import { Pool } from 'pg'
import type { PoolClient } from 'pg'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { hashPassword } from '../server/passwords'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export async function provisionLocalAdmin(client: Pick<PoolClient, 'query'>, username: string, passwordHash: string): Promise<void> {
  const role = await client.query<{ roleId: string }>(
    `SELECT rol_id::text AS "roleId"
       FROM public.cat_rol
      WHERE lower(nombre) = 'administrador'
      FOR SHARE`,
  )
  const roleId = role.rows[0]?.roleId
  if (!roleId) {
    throw new Error('Required role Administrador does not exist; no local admin changes were persisted')
  }

  const person = await client.query<{ personaId: string }>(
    `INSERT INTO public.persona (codigo_persona, nombre, apellidos, correo)
     VALUES ($1, 'Local', 'Administrator', $1)
     ON CONFLICT (correo) DO UPDATE SET updated_at = now(), activo = true
     RETURNING persona_id::text AS "personaId"`, [username],
  )
  const personaId = person.rows[0]?.personaId
  if (!personaId) throw new Error('Unable to create local admin persona')
  await client.query(
    `INSERT INTO public.app_local_admin_credentials (persona_id, username, password_hash, enabled)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (persona_id) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash, enabled = true, updated_at = now()`,
    [personaId, username, passwordHash],
  )
  const assignment = await client.query(
    `INSERT INTO public.rel_persona_rol (persona_id, codigo_persona, rol_id, fecha_inicio, activo)
     SELECT p.persona_id, p.codigo_persona, r.rol_id, now(), true
       FROM public.persona p CROSS JOIN public.cat_rol r
      WHERE p.persona_id = $1 AND r.rol_id = $2
        AND NOT EXISTS (
          SELECT 1 FROM public.rel_persona_rol current
           WHERE current.persona_id = p.persona_id AND current.rol_id = r.rol_id
             AND current.activo = true AND current.fecha_inicio <= now()
             AND (current.fecha_fin IS NULL OR current.fecha_fin > now())
        )
     RETURNING rol_id`, [personaId, roleId],
  )
  const effectiveAssignment = await client.query(
    `SELECT 1
       FROM public.rel_persona_rol
      WHERE persona_id = $1 AND rol_id = $2 AND activo = true
        AND fecha_inicio <= now() AND (fecha_fin IS NULL OR fecha_fin > now())`, [personaId, roleId],
  )
  if (assignment.rows.length === 0 && effectiveAssignment.rows.length === 0) {
    throw new Error('Unable to assign the Administrador role; transaction rolled back')
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL must be set in the environment')

  const readline = createInterface({ input, output })
  try {
    const username = (await readline.question('Local admin username: ')).trim()
    const password = await readline.question('Local admin password: ')
    if (!username || !password) throw new Error('Username and password are required')

    const passwordHash = await hashPassword(password)
    const pool = new Pool({ connectionString: databaseUrl })
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await provisionLocalAdmin(client, username, passwordHash)
      await client.query('COMMIT')
      console.log('Local administrator credential updated and assigned.')
      console.log(`LOCAL_ADMIN_PASSWORD_HASH=${passwordHash}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
      await pool.end()
    }
  } finally {
    readline.close()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
