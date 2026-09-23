import type { Pool } from 'pg'
import type { RoleRepository, SessionRepository, AuthenticatedUser, CollectionRepository, CollectionDto, WellDto, BasinDto, CollectionInput, CollectionUpdateInput } from './types'

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

const collectionColumns = `c.coleccion_id::text AS coleccion_id, c.codigo_coleccion,
  c.nombre_coleccion, c.institucion, c.responsable_coleccion,
  c.descripcion, c.estado_coleccion`
const wellColumns = `p.pozo_id::text AS pozo_id, p.codigo_pozo, p.nombre_pozo,
  p.cuenca_id::text AS cuenca_id, p.localizacion_geografica_id::text AS localizacion_geografica_id,
  p.localizacion_espacial_id::text AS localizacion_espacial_id,
  p.estado_catalogacion_id::text AS estado_catalogacion_id,
  p.estado_revision_id::text AS estado_revision_id, p.observaciones`

const collectionInputValues = (input: CollectionInput) => [
  input.codigo_coleccion,
  input.nombre_coleccion,
  input.institucion,
  input.responsable_coleccion,
  input.descripcion,
  input.estado_coleccion,
]

const collectionUpdateColumns: Record<keyof CollectionInput, string> = {
  codigo_coleccion: 'codigo_coleccion',
  nombre_coleccion: 'nombre_coleccion',
  institucion: 'institucion',
  responsable_coleccion: 'responsable_coleccion',
  descripcion: 'descripcion',
  estado_coleccion: 'estado_coleccion',
}

export function createReadRepository(pool: Pool): CollectionRepository {
  return {
    async listCollections(page, pageSize, search) {
      const offset = page * pageSize
      const filters = `WHERE ($1::text IS NULL OR c.nombre_coleccion ILIKE '%' || $1 || '%')`
      const [result, count] = await Promise.all([
        pool.query<CollectionDto>(
          `SELECT ${collectionColumns}
           FROM public."COLECCION" c
           ${filters}
           ORDER BY c.coleccion_id LIMIT $2 OFFSET $3`,
          [search || null, pageSize, offset],
        ),
        pool.query<{ total: string }>(`SELECT count(*)::text AS total FROM public."COLECCION" c ${filters}`, [search || null]),
      ])
      return { data: result.rows, total: Number(count.rows[0]?.total ?? 0) }
    },
    async getCollection(id) {
      const result = await pool.query<CollectionDto>(`SELECT ${collectionColumns} FROM public."COLECCION" c WHERE c.coleccion_id = $1`, [id])
      return result.rows[0] ?? null
    },
    async listWells(page, pageSize, search) {
      const offset = page * pageSize
      const filters = `WHERE ($1::text IS NULL OR p.nombre_pozo ILIKE '%' || $1 || '%' OR p.codigo_pozo ILIKE '%' || $1 || '%')`
      const [result, count] = await Promise.all([
        pool.query<WellDto>(
          `SELECT ${wellColumns}
           FROM public."POZO" p
           ${filters}
           ORDER BY p.nombre_pozo NULLS LAST, p.pozo_id LIMIT $2 OFFSET $3`,
          [search || null, pageSize, offset],
        ),
        pool.query<{ total: string }>(`SELECT count(*)::text AS total FROM public."POZO" p ${filters}`, [search || null]),
      ])
      return { data: result.rows, total: Number(count.rows[0]?.total ?? 0) }
    },
    async getWell(id) {
      const result = await pool.query<WellDto>(`SELECT ${wellColumns} FROM public."POZO" p WHERE p.pozo_id = $1`, [id])
      return result.rows[0] ?? null
    },
    async listBasins() {
      const result = await pool.query<BasinDto>('SELECT cuenca_id::text AS cuenca_id, nombre_cuenca FROM public."CAT_CUENCA" ORDER BY nombre_cuenca NULLS LAST, cuenca_id')
      return result.rows
    },
    async createCollection(input) {
      const result = await pool.query<CollectionDto>(
        `INSERT INTO public."COLECCION"
          (codigo_coleccion, nombre_coleccion, institucion, responsable_coleccion, descripcion, estado_coleccion)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${collectionColumns}`,
        collectionInputValues(input),
      )
      return result.rows[0]
    },
    async updateCollection(id, input) {
      const entries = (Object.keys(collectionUpdateColumns) as Array<keyof CollectionUpdateInput>)
        .filter(column => input[column] !== undefined)
      if (entries.length === 0) throw new Error('At least one collection field is required')

      const assignments = entries.map((column, index) => `${collectionUpdateColumns[column]} = $${index + 1}`)
      const values = entries.map(column => input[column])
      const result = await pool.query<CollectionDto>(
        `UPDATE public."COLECCION"
            SET ${assignments.join(', ')}, updated_at = now()
          WHERE coleccion_id = $${values.length + 1}
         RETURNING ${collectionColumns}`,
        [...values, id],
      )
      return result.rows[0] ?? null
    },
    async deleteCollection(id) {
      const result = await pool.query('DELETE FROM public."COLECCION" WHERE coleccion_id = $1', [id])
      return result.rowCount === 1
    },
  }
}
