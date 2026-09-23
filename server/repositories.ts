import type { Pool } from 'pg'
import type { RoleRepository, SessionRepository, AuthenticatedUser } from './types'

export function createRoleRepository(pool: Pool): RoleRepository {
  return {
    async findActiveUserByUsername(username) {
      const result = await pool.query<AuthenticatedUser>(
        `SELECT p.persona_id::text AS "personaId", p.correo AS username,
                concat_ws(' ', p.nombre, p.apellidos) AS name,
                array_agg(cr.nombre ORDER BY cr.jerarquia DESC) AS roles
           FROM public."PERSONA" p
           JOIN public."REL_PERSONA_ROL" rpr ON rpr.persona_id = p.persona_id
           JOIN public."CAT_ROL" cr ON cr.rol_id = rpr.rol_id
          WHERE lower(p.correo) = lower($1)
            AND p.activo = true
            AND rpr.activo = true
            AND rpr.fecha_inicio <= now()
            AND (rpr.fecha_fin IS NULL OR rpr.fecha_fin > now())
          GROUP BY p.persona_id, p.correo, p.nombre, p.apellidos`,
        [username],
      )
      return result.rows[0] ?? null
    },
  }
}

export function createSessionRepository(pool: Pool): SessionRepository {
  return {
    async create(tokenHash, user, expiresAt) {
      await pool.query(
        `INSERT INTO app_auth_sessions (token_hash, persona_id, username, user_name, roles, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tokenHash, user.personaId, user.username, user.name, user.roles, expiresAt],
      )
    },
    async find(tokenHash) {
      const result = await pool.query<AuthenticatedUser>(
        `SELECT persona_id::text AS "personaId", username, user_name AS name, roles
           FROM app_auth_sessions
          WHERE token_hash = $1 AND expires_at > now()`,
        [tokenHash],
      )
      return result.rows[0] ?? null
    },
    async remove(tokenHash) {
      await pool.query('DELETE FROM app_auth_sessions WHERE token_hash = $1', [tokenHash])
    },
  }
}
