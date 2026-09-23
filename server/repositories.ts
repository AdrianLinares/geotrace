import type { Pool } from 'pg'
import type { RoleRepository, SessionRepository, AuthenticatedUser, CollectionRepository, CollectionDto, WellDto, BasinDto, CollectionInput, CollectionUpdateInput, PlateDto, SampleDto } from './types'

export function createRoleRepository(pool: Pool): RoleRepository {
  return {
    async findActiveUserByUsername(username) {
      const result = await pool.query<AuthenticatedUser>(
        `SELECT p.persona_id::text AS "personaId", p.correo AS username,
                concat_ws(' ', p.nombre, p.apellidos) AS name,
                array_agg(cr.nombre ORDER BY cr.jerarquia DESC) AS roles
           FROM public.persona p
           JOIN public.rel_persona_rol rpr ON rpr.persona_id = p.persona_id
           JOIN public.cat_rol cr ON cr.rol_id = rpr.rol_id
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
const plateColumns = `p.placa_id::text AS placa_id, p.codigo_ubicacion, p.coleccion_id::text AS coleccion_id,
  p.codigo_placa, p.clase_placa_id::text AS clase_placa_id, cp.nombre AS clase_placa,
  p.diseno_placa_id::text AS diseno_placa_id, dp.nombre AS diseno_placa,
  p.configuracion_cavidades_id::text AS configuracion_cavidades_id,
  p.material_placa_id::text AS material_placa_id, p.color_placa_id::text AS color_placa_id,
  p.configuracion_rejilla_id::text AS configuracion_rejilla_id, p.tipo_proteccion_id::text AS tipo_proteccion_id,
  p.sistema_ensamble_id::text AS sistema_ensamble_id, p.catalogador_id::text AS catalogador_id,
  p.fecha_ingreso, p.estado_catalogacion_id::text AS estado_catalogacion_id, ec.estado AS estado_catalogacion,
  p.revisor_id::text AS revisor_id, p.fecha_revision, p.estado_revision_id::text AS estado_revision_id,
  p.comentarios, p.observaciones`
const sampleColumns = `m.muestra_id::text AS muestra_id, m.nombre_muestra_original, m.codigo_muestra_sistema,
  m.origen_muestra_id::text AS origen_muestra_id, m.metodo_adquisicion_id::text AS metodo_adquisicion_id,
  m.catalogador_id::text AS catalogador_id, m.fecha_ingreso, m.revisor_id::text AS revisor_id,
  m.fecha_revision, m.estado_catalogacion_id::text AS estado_catalogacion_id, ec.estado AS estado_catalogacion,
  m.observaciones, ms.tipo_muestra_subsuelo_id::text AS tipo_muestra_subsuelo_id,
  ms.pozo_id::text AS pozo_id, ms.tipo_intervalo_muestra_id::text AS tipo_intervalo_muestra_id,
  ms.profundidad_tope, ms.profundidad_base, ms.unidad_medida_id::text AS unidad_medida_id`

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
           FROM public.coleccion c
           ${filters}
           ORDER BY c.coleccion_id LIMIT $2 OFFSET $3`,
          [search || null, pageSize, offset],
        ),
        pool.query<{ total: string }>(`SELECT count(*)::text AS total FROM public.coleccion c ${filters}`, [search || null]),
      ])
      return { data: result.rows, total: Number(count.rows[0]?.total ?? 0) }
    },
    async getCollection(id) {
      const result = await pool.query<CollectionDto>(`SELECT ${collectionColumns} FROM public.coleccion c WHERE c.coleccion_id = $1`, [id])
      return result.rows[0] ?? null
    },
    async listWells(page, pageSize, search) {
      const offset = page * pageSize
      const filters = `WHERE ($1::text IS NULL OR p.nombre_pozo ILIKE '%' || $1 || '%' OR p.codigo_pozo ILIKE '%' || $1 || '%')`
      const [result, count] = await Promise.all([
        pool.query<WellDto>(
          `SELECT ${wellColumns}
           FROM public.pozo p
           ${filters}
           ORDER BY p.nombre_pozo NULLS LAST, p.pozo_id LIMIT $2 OFFSET $3`,
          [search || null, pageSize, offset],
        ),
         pool.query<{ total: string }>(`SELECT count(*)::text AS total FROM public.pozo p ${filters}`, [search || null]),
      ])
      return { data: result.rows, total: Number(count.rows[0]?.total ?? 0) }
    },
    async getWell(id) {
      const result = await pool.query<WellDto>(`SELECT ${wellColumns} FROM public.pozo p WHERE p.pozo_id = $1`, [id])
      return result.rows[0] ?? null
    },
    async listBasins() {
      const result = await pool.query<BasinDto>('SELECT cuenca_id::text AS cuenca_id, nombre_cuenca FROM public.cat_cuenca ORDER BY nombre_cuenca NULLS LAST, cuenca_id')
      return result.rows
    },
    async listPlates(page, pageSize, filters) {
      const offset = page * pageSize
      const where = [
        `($1::text IS NULL OR p.placa_id::text ILIKE '%' || $1 || '%' OR p.codigo_placa ILIKE '%' || $1 || '%' OR p.codigo_ubicacion ILIKE '%' || $1 || '%')`,
        `($2::bigint IS NULL OR p.coleccion_id = $2)`,
        `($3::text[] IS NULL OR ec.estado = ANY($3))`,
      ].join(' AND ')
      const params = [filters.search || null, filters.collectionId || null, filters.states?.length ? filters.states : null]
       const from = `FROM public.placa p
         LEFT JOIN public.cat_clase_placa cp ON cp.clase_placa_id = p.clase_placa_id
         LEFT JOIN public.cat_diseno_placa dp ON dp.diseno_placa_id = p.diseno_placa_id
         LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id`
      const [result, count] = await Promise.all([
        pool.query<PlateDto>(`SELECT ${plateColumns} ${from} WHERE ${where} ORDER BY p.placa_id LIMIT $4 OFFSET $5`, [...params, pageSize, offset]),
        pool.query<{ total: string }>(`SELECT count(*)::text AS total ${from} WHERE ${where}`, params),
      ])
      return { data: result.rows, total: Number(count.rows[0]?.total ?? 0) }
    },
    async getPlate(id) {
      const result = await pool.query<PlateDto>(`SELECT ${plateColumns} FROM public.placa p
         LEFT JOIN public.cat_clase_placa cp ON cp.clase_placa_id = p.clase_placa_id
         LEFT JOIN public.cat_diseno_placa dp ON dp.diseno_placa_id = p.diseno_placa_id
         LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id
        WHERE p.placa_id = $1`, [id])
      return result.rows[0] ?? null
    },
    async listSamples(page, pageSize) {
       const from = `FROM public.muestra m
         LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = m.estado_catalogacion_id
         LEFT JOIN public.muestra_subsuelo ms ON ms.muestra_id = m.muestra_id`
      const [result, count] = await Promise.all([
        pool.query<SampleDto>(`SELECT ${sampleColumns} ${from} ORDER BY m.muestra_id LIMIT $1 OFFSET $2`, [pageSize, page * pageSize]),
        pool.query<{ total: string }>(`SELECT count(*)::text AS total ${from}`, []),
      ])
      return { data: result.rows, total: Number(count.rows[0]?.total ?? 0) }
    },
    async getSample(id) {
      const result = await pool.query<SampleDto>(`SELECT ${sampleColumns} FROM public.muestra m
         LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = m.estado_catalogacion_id
         LEFT JOIN public.muestra_subsuelo ms ON ms.muestra_id = m.muestra_id
        WHERE m.muestra_id = $1`, [id])
      return result.rows[0] ?? null
    },
    async createCollection(input) {
      const result = await pool.query<CollectionDto>(
        `INSERT INTO public.coleccion
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
        `UPDATE public.coleccion
            SET ${assignments.join(', ')}, updated_at = now()
          WHERE coleccion_id = $${values.length + 1}
         RETURNING ${collectionColumns}`,
        [...values, id],
      )
      return result.rows[0] ?? null
    },
    async deleteCollection(id) {
      const result = await pool.query('DELETE FROM public.coleccion WHERE coleccion_id = $1', [id])
      return result.rowCount === 1
    },
  }
}
