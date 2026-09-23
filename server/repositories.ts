import type { Pool } from 'pg'
import type { RoleRepository, SessionRepository, AuthenticatedUser, CollectionRepository, CollectionDto, WellDto, BasinDto, CollectionInput, CollectionUpdateInput, PlateDto, SampleDto, PhysicalLocationDto, DashboardDto, DashboardKpisDto, DashboardEstadoDto, DashboardOcupacionDto, DashboardProblemaDto, AdminRepository, ManagedPerson, ApplicationRole, PersonUpdateInput, ConservationRepository, ConservationReferenceDto } from './types'

export class LastAdministratorError extends Error {}
export class UnknownRoleError extends Error {}

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

const managedPersonColumns = `p.persona_id::text AS persona_id, p.codigo_persona, p.nombre, p.apellidos,
  p.correo, p.activo, coalesce(json_agg(json_build_object('rol_id', cr.rol_id::text, 'nombre', cr.nombre)
  ORDER BY cr.jerarquia DESC) FILTER (WHERE cr.rol_id IS NOT NULL), '[]') AS roles`

export function createAdminRepository(pool: Pool): AdminRepository {
  const listPeople = async (client: Pick<Pool, 'query'> = pool): Promise<ManagedPerson[]> => {
    const result = await client.query<ManagedPerson>(`SELECT ${managedPersonColumns}
      FROM public.persona p
      LEFT JOIN public.rel_persona_rol rpr ON rpr.persona_id = p.persona_id
        AND rpr.activo = true AND rpr.fecha_inicio <= now()
        AND (rpr.fecha_fin IS NULL OR rpr.fecha_fin > now())
      LEFT JOIN public.cat_rol cr ON cr.rol_id = rpr.rol_id
      GROUP BY p.persona_id ORDER BY p.apellidos, p.nombre, p.persona_id`)
    return result.rows
  }

  return {
    listPeople,
    async listRoles() {
      const result = await pool.query<ApplicationRole>('SELECT rol_id::text AS rol_id, nombre, jerarquia FROM public.cat_rol ORDER BY jerarquia DESC, nombre')
      return result.rows
    },
    async updatePerson(personaId: string, input: PersonUpdateInput) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        // Serialize administrator changes so two concurrent updates cannot both remove the last administrator.
        await client.query('SELECT pg_advisory_xact_lock($1)', [19478231])
        const person = await client.query<{ persona_id: string }>('SELECT persona_id::text FROM public.persona WHERE persona_id = $1 FOR UPDATE', [personaId])
        if (!person.rows[0]) {
          await client.query('ROLLBACK')
          return null
        }

        if (input.role_ids) {
          const roles = await client.query<{ rol_id: string }>('SELECT rol_id::text FROM public.cat_rol WHERE rol_id = ANY($1::bigint[])', [input.role_ids])
          if (roles.rowCount !== input.role_ids.length) throw new UnknownRoleError('Unknown application role')
        }

        const fields = ['nombre', 'apellidos', 'correo', 'activo'] as const
        const changes = fields.filter(field => input[field] !== undefined)
        if (changes.length) {
          const values = changes.map(field => input[field])
          const assignments = changes.map((field, index) => `${field} = $${index + 1}`)
          await client.query(`UPDATE public.persona SET ${assignments.join(', ')}, updated_at = now() WHERE persona_id = $${values.length + 1}`, [...values, personaId])
        }
        if (input.role_ids) {
          await client.query('UPDATE public.rel_persona_rol SET activo = false, fecha_fin = now(), updated_at = now() WHERE persona_id = $1 AND activo = true', [personaId])
          if (input.role_ids.length) {
            await client.query(`INSERT INTO public.rel_persona_rol (persona_id, codigo_persona, rol_id, fecha_inicio, activo)
              SELECT p.persona_id, p.codigo_persona, role_id, now(), true FROM public.persona p
              CROSS JOIN unnest($1::bigint[]) AS role_id WHERE p.persona_id = $2`, [input.role_ids, personaId])
          }
        }
        const admins = await client.query<{ count: string }>(`SELECT count(DISTINCT rpr.persona_id)::text AS count
          FROM public.rel_persona_rol rpr JOIN public.cat_rol cr ON cr.rol_id = rpr.rol_id
          JOIN public.persona p ON p.persona_id = rpr.persona_id
          WHERE p.activo = true AND rpr.activo = true AND rpr.fecha_inicio <= now()
            AND (rpr.fecha_fin IS NULL OR rpr.fecha_fin > now()) AND lower(cr.nombre) = 'administrador'`)
        if (Number(admins.rows[0]?.count ?? 0) === 0) throw new LastAdministratorError('At least one administrator is required')
        const updated = (await listPeople(client)).find(persona => persona.persona_id === personaId) ?? null
        await client.query('COMMIT')
        return updated
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
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

export function createConservationRepository(pool: Pool): ConservationRepository {
  const list = async <T extends ConservationReferenceDto[keyof ConservationReferenceDto]>(table: string, idColumn: string, nameColumn: string): Promise<T> => {
    const result = await pool.query(`SELECT ${idColumn}::text AS id, ${nameColumn} AS name FROM public.${table} ORDER BY ${idColumn}`)
    return result.rows as T
  }

  return {
    async listStates() {
      const [vidrio, acetato, marcoPlaca] = await Promise.all([
        list<ConservationReferenceDto['vidrio']>('cat_vidrio_estado', 'vidrio_estado_id', 'vidrio_estado'),
        list<ConservationReferenceDto['acetato']>('cat_acetato_estado', 'acetato_estado_id', 'acetato_estado'),
        list<ConservationReferenceDto['marcoPlaca']>('cat_marco_placa_estado', 'marco_placa_estado_id', 'marco_placa_estado'),
      ])
      return { vidrio, acetato, marcoPlaca }
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
const physicalLocationColumns = `uf.ubicacion_fisica_id::text AS ubicacion_fisica_id, uf.codigo_ubicacion,
  uf.placa_id::text AS placa_id, uf.bandeja_id::text AS bandeja_id, b.numero_bandeja,
  zm.zona_mueble_id::text AS zona_mueble_id, zm.seccion_mueble_id::text AS seccion_mueble_id,
  cs.codigo_seccion AS seccion_codigo, cs.nombre AS seccion_nombre,
  uf.columna_bandeja_id::text AS columna_bandeja_id, ccb.codigo_columna AS columna_codigo,
  ccb.nombre AS columna_nombre, uf.posicion_bandeja,
  b.material_bandeja_id::text AS material_bandeja_id, cmb.nombre AS material_bandeja,
  uf.fecha_ubicacion, uf.observaciones`

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
    async listPhysicalLocations(page, pageSize, filters) {
      const offset = page * pageSize
      const from = `FROM public.ubicacion_fisica uf
        LEFT JOIN public.bandeja b ON b.bandeja_id = uf.bandeja_id
        LEFT JOIN public.zona_mueble zm ON zm.zona_mueble_id = b.zona_mueble_id
        LEFT JOIN public.cat_seccion cs ON cs.seccion_id = zm.seccion_mueble_id
        LEFT JOIN public.cat_columna_bandeja ccb ON ccb.columna_bandeja_id = uf.columna_bandeja_id
        LEFT JOIN public.cat_material_bandeja cmb ON cmb.material_bandeja_id = b.material_bandeja_id`
      const where = [
        `($1::text IS NULL OR uf.codigo_ubicacion ILIKE '%' || $1 || '%' OR cs.codigo_seccion ILIKE '%' || $1 || '%' OR cs.nombre ILIKE '%' || $1 || '%' OR ccb.codigo_columna ILIKE '%' || $1 || '%')`,
        `($2::boolean IS NULL OR (uf.placa_id IS NOT NULL) = $2)`,
        `($3::bigint IS NULL OR zm.seccion_mueble_id = $3)`,
      ].join(' AND ')
      const params = [filters.search || null, filters.occupied ?? null, filters.sectionId || null]
      const [result, count] = await Promise.all([
        pool.query<PhysicalLocationDto>(`SELECT ${physicalLocationColumns} ${from} WHERE ${where} ORDER BY uf.ubicacion_fisica_id LIMIT $4 OFFSET $5`, [...params, pageSize, offset]),
        pool.query<{ total: string }>(`SELECT count(*)::text AS total ${from} WHERE ${where}`, params),
      ])
      return { data: result.rows, total: Number(count.rows[0]?.total ?? 0) }
    },
    async getPhysicalLocation(id) {
      const result = await pool.query<PhysicalLocationDto>(`SELECT ${physicalLocationColumns} FROM public.ubicacion_fisica uf
        LEFT JOIN public.bandeja b ON b.bandeja_id = uf.bandeja_id
        LEFT JOIN public.zona_mueble zm ON zm.zona_mueble_id = b.zona_mueble_id
        LEFT JOIN public.cat_seccion cs ON cs.seccion_id = zm.seccion_mueble_id
        LEFT JOIN public.cat_columna_bandeja ccb ON ccb.columna_bandeja_id = uf.columna_bandeja_id
        LEFT JOIN public.cat_material_bandeja cmb ON cmb.material_bandeja_id = b.material_bandeja_id
        WHERE uf.ubicacion_fisica_id = $1`, [id])
      return result.rows[0] ?? null
    },
    async getDashboard() {
      const [kpis, estados, ocupacion, problemas] = await Promise.all([
        pool.query<DashboardKpisDto>(`SELECT
          count(*) FILTER (WHERE true)::int AS "totalPlacas",
          (SELECT count(*)::int FROM public.muestra) AS "totalMuestras",
          count(*) FILTER (WHERE ec.estado = 'Validado')::int AS "placasValidadas",
          (SELECT count(*)::int FROM public.ubicacion_fisica WHERE placa_id IS NULL) AS "ubicacionesDisponibles"
        FROM public.placa p
        LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id`),
        pool.query<DashboardEstadoDto>(`SELECT coalesce(ec.estado, 'Sin estado') AS name, count(*)::int AS value
          FROM public.placa p
          LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id
          GROUP BY ec.estado
          ORDER BY value DESC, name`),
        pool.query<DashboardOcupacionDto>(`SELECT coalesce(cs.nombre, cs.codigo_seccion, 'Sin sección') AS name,
          count(*)::int AS total,
          count(*) FILTER (WHERE uf.placa_id IS NOT NULL)::int AS ocupadas,
          coalesce(round(100.0 * count(*) FILTER (WHERE uf.placa_id IS NOT NULL) / nullif(count(*), 0)), 0)::int AS ocupacion
          FROM public.ubicacion_fisica uf
          LEFT JOIN public.bandeja b ON b.bandeja_id = uf.bandeja_id
          LEFT JOIN public.zona_mueble zm ON zm.zona_mueble_id = b.zona_mueble_id
          LEFT JOIN public.cat_seccion cs ON cs.seccion_id = zm.seccion_mueble_id
          GROUP BY cs.nombre, cs.codigo_seccion
          ORDER BY name`),
        pool.query<DashboardProblemaDto>(`SELECT eci.placa_id::text AS placa_id,
          CASE WHEN eci.presencia_hongos OR eci.riesgo_contaminacion OR eci.vidrio_estado_id IN (2, 3)
            THEN 'CRÍTICA'
            WHEN eci.material_fuera_cavidad OR eci.oxidacion OR eci.crecimiento_cristales THEN 'ATENCIÓN'
            ELSE 'LEVE' END AS nivel,
          cv.vidrio_estado, eci.presencia_hongos, eci.riesgo_contaminacion
          FROM public.estado_conservacion_inicial eci
          LEFT JOIN public.cat_vidrio_estado cv ON cv.vidrio_estado_id = eci.vidrio_estado_id
          WHERE eci.placa_id IS NOT NULL
            AND (eci.presencia_hongos OR eci.riesgo_contaminacion OR eci.vidrio_estado_id IN (2, 3)
              OR eci.material_fuera_cavidad OR eci.oxidacion OR eci.crecimiento_cristales)
          ORDER BY CASE WHEN eci.presencia_hongos OR eci.riesgo_contaminacion OR eci.vidrio_estado_id IN (2, 3) THEN 0 ELSE 1 END,
            eci.placa_id`),
      ])
      const totals = kpis.rows[0] ?? { totalPlacas: 0, totalMuestras: 0, placasValidadas: 0, ubicacionesDisponibles: 0 }
      return {
        kpis: { ...totals, placasValidadas: totals.totalPlacas ? Math.round((totals.placasValidadas / totals.totalPlacas) * 100) : 0 },
        estadoCatalogacion: estados.rows,
        ocupacion: ocupacion.rows,
        // Local schema does not create public.auditoria yet; administrative audit is pending.
        actividadReciente: [],
        problemasConservacion: problemas.rows,
      }
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
