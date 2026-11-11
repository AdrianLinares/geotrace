import type { Pool } from 'pg'
import type { AuthenticatedUser } from './types'

export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'IMPORT'
export type AuditEntry = { tabla: string; operacion: AuditOperation; registroId?: string | null; user?: AuthenticatedUser | null; cambios?: unknown }

export function createAuditRepository(pool: Pick<Pool, 'query'>) {
  return {
    async record(entry: AuditEntry): Promise<void> {
      await pool.query(
        `INSERT INTO public.auditoria (tabla, operacion, registro_id, persona_id, cambios)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [entry.tabla, entry.operacion, entry.registroId ?? null, entry.user?.personaId ?? null, JSON.stringify(entry.cambios ?? null)],
      )
    },
    async list(limit = 50) {
      const result = await pool.query(`
        SELECT a.auditoria_id::text AS auditoria_id, a.tabla, a.operacion,
               a.registro_id, a.cambios, a.created_at,
               a.persona_id::text AS persona_id,
               concat_ws(' ', p.nombre, p.apellidos) AS persona_nombre
          FROM public.auditoria a
          LEFT JOIN public.persona p ON p.persona_id = a.persona_id
         ORDER BY a.created_at DESC, a.auditoria_id DESC
         LIMIT $1`, [limit])
      return result.rows
    },
  }
}

export type AuditRepository = ReturnType<typeof createAuditRepository>
