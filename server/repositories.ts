import type { Pool } from 'pg'
import type { RoleRepository, SessionRepository, AuthenticatedUser, CollectionRepository, CollectionDto, WellDto, BasinDto, CollectionInput, CollectionUpdateInput, PlateDto, SampleDto, SampleMutationInput, PhysicalLocationDto, DashboardDto, DashboardKpisDto, DashboardEstadoDto, DashboardOcupacionDto, DashboardProblemaDto, AdminRepository, ManagedPerson, ApplicationRole, PersonUpdateInput, ConservationRepository, ConservationReferenceDto, PlateMutationInput, PlateRepository, ImportRepository, ImportBatch, ImportTable, ImportRow, CatalogRepository, CatalogReferencesDto, PlateClassDto, PlateDesignDto, CatalogationStateDto, ReviewStateDto, PlateMaterialDto, PlateColorDto, CavityConfigurationDto, GridConfigurationDto, PlateUseStageDto, ProtectionTypeDto, AssemblySystemDto, LitoReportadaDto, LitoNormalizadaDto, LitoActualizadaDto, BiozonaReportadaDto, BiozonaNormalizadaDto, BiozonaActualizadaDto, EdadReportadaDto, EdadNormalizadaDto, EdadActualizadaDto } from './types'
import { importColumns, validateImportRows } from './importValidation'

export class LastAdministratorError extends Error {}
export class UnknownRoleError extends Error {}
export class InvalidPlateTransitionError extends Error {}
export class PlateAuthorizationError extends Error {}

export function createRoleRepository(pool: Pool): RoleRepository {
  return {
    async findActiveUserByLogin(login) {
      const result = await pool.query<AuthenticatedUser>(
        `SELECT p.persona_id::text AS "personaId", p.ad_username AS username,
                concat_ws(' ', p.nombre, p.apellidos) AS name,
                array_agg(cr.nombre ORDER BY cr.jerarquia DESC) AS roles
           FROM public.persona p
           JOIN public.rel_persona_rol rpr ON rpr.persona_id = p.persona_id
           JOIN public.cat_rol cr ON cr.rol_id = rpr.rol_id
          WHERE lower(p.ad_username) = lower($1)
            AND p.activo = true
            AND rpr.activo = true
            AND rpr.fecha_inicio <= now()
            AND (rpr.fecha_fin IS NULL OR rpr.fecha_fin > now())
          GROUP BY p.persona_id, p.ad_username, p.nombre, p.apellidos`,
        [login],
      )
      return result.rows[0] ?? null
    },
  }
}

const managedPersonColumns = `p.persona_id::text AS persona_id, p.codigo_persona, p.nombre, p.apellidos,
  p.correo, p.ad_username, p.activo, coalesce(json_agg(json_build_object('rol_id', cr.rol_id::text, 'nombre', cr.nombre)
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
          // Close only the assignments that are no longer requested. Unchanged roles keep their
          // original row so the assignment history stays auditable.
          await client.query(
            `UPDATE public.rel_persona_rol
                SET activo = false, fecha_fin = now(), updated_at = now()
              WHERE persona_id = $1
                AND activo = true
                AND (rol_id <> ALL($2::bigint[]) OR (fecha_fin IS NOT NULL AND fecha_fin <= now()))`,
            [personaId, input.role_ids],
          )
          if (input.role_ids.length) {
            await client.query(
              `INSERT INTO public.rel_persona_rol (persona_id, codigo_persona, rol_id, fecha_inicio, activo)
               SELECT p.persona_id, p.codigo_persona, role_id, now(), true
                 FROM public.persona p
                 CROSS JOIN unnest($1::bigint[]) AS role_id
                WHERE p.persona_id = $2
                  AND NOT EXISTS (
                    SELECT 1 FROM public.rel_persona_rol current
                     WHERE current.persona_id = p.persona_id
                       AND current.rol_id = role_id
                       AND current.activo = true
                       AND (current.fecha_fin IS NULL OR current.fecha_fin > now())
                  )`,
              [input.role_ids, personaId],
            )
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

const importTableSql: Record<ImportTable, { table: string; columns: readonly string[] }> = {
  coleccion: { table: 'public.coleccion', columns: importColumns.coleccion },
  pozo: { table: 'public.pozo', columns: importColumns.pozo },
  placa: { table: 'public.placa', columns: importColumns.placa },
  muestra: { table: 'public.muestra', columns: importColumns.muestra },
  dic_uni_lito_reportada: { table: 'public.dic_uni_lito_reportada', columns: importColumns.dic_uni_lito_reportada },
  dic_uni_lito_normalizada: { table: 'public.dic_uni_lito_normalizada', columns: importColumns.dic_uni_lito_normalizada },
  dic_uni_lito_actualizada: { table: 'public.dic_uni_lito_actualizada', columns: importColumns.dic_uni_lito_actualizada },
  dic_biozona_reportada: { table: 'public.dic_biozona_reportada', columns: importColumns.dic_biozona_reportada },
  dic_biozona_normalizada: { table: 'public.dic_biozona_normalizada', columns: importColumns.dic_biozona_normalizada },
  dic_biozona_actualizada: { table: 'public.dic_biozona_actualizada', columns: importColumns.dic_biozona_actualizada },
  dic_edad_reportada: { table: 'public.dic_edad_reportada', columns: importColumns.dic_edad_reportada },
  dic_edad_normalizada: { table: 'public.dic_edad_normalizada', columns: importColumns.dic_edad_normalizada },
  dic_edad_actualizada: { table: 'public.dic_edad_actualizada', columns: importColumns.dic_edad_actualizada },
}

export function createImportRepository(pool: Pool): ImportRepository {
  return {
    async importBatches(batches: ImportBatch[]) {
      const validatedBatches = batches.map(({ table, rows }) => ({ table, rows: validateImportRows(table, rows) as ImportRow[] }))
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        for (const { table, rows } of validatedBatches) {
          const definition = importTableSql[table]
          const placeholders = definition.columns.map((_, index) => `$${index + 1}`).join(', ')
          const statement = `INSERT INTO ${definition.table} (${definition.columns.join(', ')}) VALUES (${placeholders})`
          for (const row of rows) {
            await client.query(statement, definition.columns.map((column) => row[column] ?? null))
          }
        }
        await client.query('COMMIT')
        return validatedBatches.reduce((total, batch) => total + batch.rows.length, 0)
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
      await pool.query('DELETE FROM app_auth_sessions WHERE expires_at <= now()')
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

export function createCatalogRepository(pool: Pool): CatalogRepository {
  const limit = 1000
  return {
    async listReferences(): Promise<CatalogReferencesDto> {
      const [cuencas, clasesPlaca, disenosPlaca, estadosCatalogacion, estadosRevision, materialesPlaca, coloresPlaca, configuracionesCavidades, configuracionesRejilla, etapasUsoPlaca, tiposProteccion, sistemasEnsamble, litoReportada, litoNormalizada, litoActualizada, biozonaReportada, biozonaNormalizada, biozonaActualizada, edadReportada, edadNormalizada, edadActualizada] = await Promise.all([
        pool.query<BasinDto>('SELECT cuenca_id::text AS cuenca_id, nombre_cuenca FROM public.cat_cuenca ORDER BY nombre_cuenca NULLS LAST, cuenca_id LIMIT $1', [limit]),
        pool.query<PlateClassDto>('SELECT clase_placa_id::text AS clase_placa_id, codigo_clase, nombre, definicion FROM public.cat_clase_placa ORDER BY nombre NULLS LAST, clase_placa_id LIMIT $1', [limit]),
        pool.query<PlateDesignDto>('SELECT diseno_placa_id::text AS diseno_placa_id, nombre FROM public.cat_diseno_placa ORDER BY nombre NULLS LAST, diseno_placa_id LIMIT $1', [limit]),
        pool.query<CatalogationStateDto>('SELECT estado_catalogacion_id::text AS estado_catalogacion_id, estado, significado, quien FROM public.cat_estado_catalogacion ORDER BY estado_catalogacion_id LIMIT $1', [limit]),
        pool.query<ReviewStateDto>('SELECT estado_revision_id::text AS estado_revision_id, nombre, significado FROM public.cat_estado_revision ORDER BY estado_revision_id LIMIT $1', [limit]),
        pool.query<PlateMaterialDto>('SELECT material_placa_id::text AS material_placa_id, nombre FROM public.cat_material_placa ORDER BY nombre NULLS LAST, material_placa_id LIMIT $1', [limit]),
        pool.query<PlateColorDto>('SELECT color_placa_id::text AS color_placa_id, nombre FROM public.cat_color_placa ORDER BY nombre NULLS LAST, color_placa_id LIMIT $1', [limit]),
        pool.query<CavityConfigurationDto>('SELECT configuracion_cavidades_id::text AS configuracion_cavidades_id, diseno_placa_id::text AS diseno_placa_id, total_cavidades FROM public.cat_configuracion_cavidades ORDER BY configuracion_cavidades_id LIMIT $1', [limit]),
        pool.query<GridConfigurationDto>('SELECT configuracion_rejilla_id::text AS configuracion_rejilla_id, nombre, numero_subdivisiones, observaciones FROM public.cat_configuracion_rejilla ORDER BY nombre NULLS LAST, configuracion_rejilla_id LIMIT $1', [limit]),
        pool.query<PlateUseStageDto>('SELECT etapa_uso_placa_id::text AS etapa_uso_placa_id, codigo_etapa_uso_placa, nombre, observaciones FROM public.cat_etapa_uso_placa ORDER BY nombre NULLS LAST, etapa_uso_placa_id LIMIT $1', [limit]),
        pool.query<ProtectionTypeDto>('SELECT tipo_proteccion_id::text AS tipo_proteccion_id, nombre FROM public.cat_tipo_proteccion ORDER BY nombre NULLS LAST, tipo_proteccion_id LIMIT $1', [limit]),
        pool.query<AssemblySystemDto>('SELECT sistema_ensamble_id::text AS sistema_ensamble_id, nombre FROM public.cat_sistema_ensamble ORDER BY nombre NULLS LAST, sistema_ensamble_id LIMIT $1', [limit]),
        pool.query<LitoReportadaDto>('SELECT uni_lito_reportada_id::text AS uni_lito_reportada_id, codigo_uni_lito_reportada, nombre_reportado, catalogador_id::text AS catalogador_id, fecha_ingreso, revisor_id::text AS revisor_id, fecha_revision, estado_revision_id::text AS estado_revision_id, observaciones FROM public.dic_uni_lito_reportada ORDER BY nombre_reportado NULLS LAST, uni_lito_reportada_id LIMIT $1', [limit]),
        pool.query<LitoNormalizadaDto>('SELECT uni_lito_normalizada_id::text AS uni_lito_normalizada_id, cod_uni_lito_normalizada, nombre_normalizado, rango_lito_id::text AS rango_lito_id, referencia_bibliografica_id::text AS referencia_bibliografica_id, observaciones, revisor_id::text AS revisor_id, estado_revision_id::text AS estado_revision_id, fecha_revision FROM public.dic_uni_lito_normalizada ORDER BY nombre_normalizado NULLS LAST, uni_lito_normalizada_id LIMIT $1', [limit]),
        pool.query<LitoActualizadaDto>('SELECT uni_lito_actualizada_id::text AS uni_lito_actualizada_id, cod_uni_lito_actualizada, nombre_oficial, rango_lito_id::text AS rango_lito_id, estado_nomenclatura_id::text AS estado_nomenclatura_id, revisor_id::text AS revisor_id, fecha_revision, estado_revision_id::text AS estado_revision_id, observaciones FROM public.dic_uni_lito_actualizada ORDER BY nombre_oficial NULLS LAST, uni_lito_actualizada_id LIMIT $1', [limit]),
        pool.query<BiozonaReportadaDto>('SELECT biozona_reportada_id::text AS biozona_reportada_id, nombre_reportado, autor_biozona_reportada, codigo_biozona, estado_revision_id::text AS estado_revision_id, catalogador_id::text AS catalogador_id, fecha_ingreso, revisor_id::text AS revisor_id, fecha_revision, observaciones FROM public.dic_biozona_reportada ORDER BY nombre_reportado NULLS LAST, biozona_reportada_id LIMIT $1', [limit]),
        pool.query<BiozonaNormalizadaDto>('SELECT biozona_normalizada_id::text AS biozona_normalizada_id, nombre_normalizado, codigo_biozona, autor_biozona_normalizada, estado_revision_id::text AS estado_revision_id, revisor_id::text AS revisor_id, fecha_revision, observaciones FROM public.dic_biozona_normalizada ORDER BY nombre_normalizado NULLS LAST, biozona_normalizada_id LIMIT $1', [limit]),
        pool.query<BiozonaActualizadaDto>('SELECT biozona_actualizada_id::text AS biozona_actualizada_id, nombre_actualizado, codigo_biozona_actual, fuente_actualizacion, fecha_actualizacion, revisor_id::text AS revisor_id, fecha_revision, estado_revision_id::text AS estado_revision_id, observaciones FROM public.dic_biozona_actualizada ORDER BY nombre_actualizado NULLS LAST, biozona_actualizada_id LIMIT $1', [limit]),
        pool.query<EdadReportadaDto>('SELECT edad_reportada_id::text AS edad_reportada_id, nombre_reportado, estado_revision_id::text AS estado_revision_id, catalogador_id::text AS catalogador_id, fecha_ingreso, revisor_id::text AS revisor_id, fecha_revision, observaciones FROM public.dic_edad_reportada ORDER BY nombre_reportado NULLS LAST, edad_reportada_id LIMIT $1', [limit]),
        pool.query<EdadNormalizadaDto>('SELECT edad_normalizada_id::text AS edad_normalizada_id, nombre_normalizado, rango_cronoestratigrafico_id::text AS rango_cronoestratigrafico_id, estado_revision_id::text AS estado_revision_id, revisor_id::text AS revisor_id, fecha_revision, observaciones FROM public.dic_edad_normalizada ORDER BY nombre_normalizado NULLS LAST, edad_normalizada_id LIMIT $1', [limit]),
        pool.query<EdadActualizadaDto>('SELECT edad_actualizada_id::text AS edad_actualizada_id, nombre_actualizado, escala_tiempo, fuente_actualizacion, revisor_id::text AS revisor_id, fecha_revision, estado_revision_id::text AS estado_revision_id, observaciones FROM public.dic_edad_actualizada ORDER BY nombre_actualizado NULLS LAST, edad_actualizada_id LIMIT $1', [limit]),
      ])
      return {
        cuencas: cuencas.rows,
        clasesPlaca: clasesPlaca.rows,
        disenosPlaca: disenosPlaca.rows,
        estadosCatalogacion: estadosCatalogacion.rows,
        estadosRevision: estadosRevision.rows,
        materialesPlaca: materialesPlaca.rows,
        coloresPlaca: coloresPlaca.rows,
        configuracionesCavidades: configuracionesCavidades.rows,
        configuracionesRejilla: configuracionesRejilla.rows,
        etapasUsoPlaca: etapasUsoPlaca.rows,
        tiposProteccion: tiposProteccion.rows,
        sistemasEnsamble: sistemasEnsamble.rows,
        unidadesLitoestratigraficas: { reportada: litoReportada.rows, normalizada: litoNormalizada.rows, actualizada: litoActualizada.rows },
        biozonas: { reportada: biozonaReportada.rows, normalizada: biozonaNormalizada.rows, actualizada: biozonaActualizada.rows },
        edades: { reportada: edadReportada.rows, normalizada: edadNormalizada.rows, actualizada: edadActualizada.rows },
      }
    },
  }
}

const collectionColumns = `c.coleccion_id::text AS coleccion_id, c.codigo_coleccion,
  c.nombre_coleccion, c.institucion, c.responsable_coleccion,
  c.descripcion, c.estado_coleccion`
const wellColumns = `p.pozo_id::text AS pozo_id, p.codigo_pozo, p.nombre_pozo,
  p.cuenca_id::text AS cuenca_id, cu.nombre_cuenca AS cuenca_nombre,
  p.localizacion_geografica_id::text AS localizacion_geografica_id,
  p.localizacion_espacial_id::text AS localizacion_espacial_id,
  p.estado_catalogacion_id::text AS estado_catalogacion_id, ec.estado AS estado_catalogacion,
  p.estado_revision_id::text AS estado_revision_id, er.nombre AS estado_revision, p.observaciones`
 const plateColumns = `p.placa_id::text AS placa_id, p.codigo_ubicacion, p.coleccion_id::text AS coleccion_id,
  c.nombre_coleccion AS coleccion_nombre,
  p.codigo_placa, p.clase_placa_id::text AS clase_placa_id, cp.nombre AS clase_placa,
  p.etapa_uso_placa_id::text AS etapa_uso_placa_id,
  p.diseno_placa_id::text AS diseno_placa_id, dp.nombre AS diseno_placa,
  p.configuracion_cavidades_id::text AS configuracion_cavidades_id, cc.total_cavidades,
  p.material_placa_id::text AS material_placa_id, p.color_placa_id::text AS color_placa_id,
  p.configuracion_rejilla_id::text AS configuracion_rejilla_id, p.tipo_proteccion_id::text AS tipo_proteccion_id,
  p.sistema_ensamble_id::text AS sistema_ensamble_id, p.catalogador_id::text AS catalogador_id,
  p.fecha_ingreso, p.estado_catalogacion_id::text AS estado_catalogacion_id, ec.estado AS estado_catalogacion,
  p.revisor_id::text AS revisor_id, p.fecha_revision, p.estado_revision_id::text AS estado_revision_id,
  p.comentarios, p.observaciones`
const sampleColumns = `m.muestra_id::text AS muestra_id, m.nombre_muestra_original, m.codigo_muestra_sistema,
  m.coleccion_id::text AS coleccion_id,
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

const plateMutationColumns: Record<keyof PlateMutationInput, string> = {
  codigo_ubicacion: 'codigo_ubicacion', coleccion_id: 'coleccion_id', codigo_placa: 'codigo_placa', clase_placa_id: 'clase_placa_id',
  etapa_uso_placa_id: 'etapa_uso_placa_id', diseno_placa_id: 'diseno_placa_id', configuracion_cavidades_id: 'configuracion_cavidades_id',
  material_placa_id: 'material_placa_id', color_placa_id: 'color_placa_id', configuracion_rejilla_id: 'configuracion_rejilla_id',
  tipo_proteccion_id: 'tipo_proteccion_id', sistema_ensamble_id: 'sistema_ensamble_id', catalogador_id: 'catalogador_id', fecha_ingreso: 'fecha_ingreso',
  estado_catalogacion_id: 'estado_catalogacion_id', revisor_id: 'revisor_id', fecha_revision: 'fecha_revision', estado_revision_id: 'estado_revision_id',
  comentarios: 'comentarios', observaciones: 'observaciones',
}
const sampleMutationColumns: Record<keyof SampleMutationInput, string> = {
  coleccion_id: 'coleccion_id',
  nombre_muestra_original: 'nombre_muestra_original', codigo_muestra_sistema: 'codigo_muestra_sistema',
  origen_muestra_id: 'origen_muestra_id', metodo_adquisicion_id: 'metodo_adquisicion_id', catalogador_id: 'catalogador_id',
  fecha_ingreso: 'fecha_ingreso', revisor_id: 'revisor_id', fecha_revision: 'fecha_revision',
  estado_catalogacion_id: 'estado_catalogacion_id', observaciones: 'observaciones',
}

const getPlate = (client: Pick<Pool, 'query'>, id: string) => client.query<PlateDto>(`SELECT ${plateColumns} FROM public.placa p
  LEFT JOIN public.cat_clase_placa cp ON cp.clase_placa_id = p.clase_placa_id
  LEFT JOIN public.cat_diseno_placa dp ON dp.diseno_placa_id = p.diseno_placa_id
  LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id
  WHERE p.placa_id = $1`, [id]).then(result => result.rows[0] ?? null)

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

export function createReadRepository(pool: Pool): PlateRepository {
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
           LEFT JOIN public.cat_cuenca cu ON cu.cuenca_id = p.cuenca_id
           LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id
           LEFT JOIN public.cat_estado_revision er ON er.estado_revision_id = p.estado_revision_id
           ${filters}
           ORDER BY p.nombre_pozo NULLS LAST, p.pozo_id LIMIT $2 OFFSET $3`,
          [search || null, pageSize, offset],
        ),
         pool.query<{ total: string }>(`SELECT count(*)::text AS total FROM public.pozo p ${filters}`, [search || null]),
      ])
      return { data: result.rows, total: Number(count.rows[0]?.total ?? 0) }
    },
    async getWell(id) {
      const result = await pool.query<WellDto>(`SELECT ${wellColumns} FROM public.pozo p
        LEFT JOIN public.cat_cuenca cu ON cu.cuenca_id = p.cuenca_id
        LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id
        LEFT JOIN public.cat_estado_revision er ON er.estado_revision_id = p.estado_revision_id
        WHERE p.pozo_id = $1`, [id])
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
         LEFT JOIN public.coleccion c ON c.coleccion_id = p.coleccion_id
         LEFT JOIN public.cat_clase_placa cp ON cp.clase_placa_id = p.clase_placa_id
         LEFT JOIN public.cat_diseno_placa dp ON dp.diseno_placa_id = p.diseno_placa_id
         LEFT JOIN public.cat_configuracion_cavidades cc ON cc.configuracion_cavidades_id = p.configuracion_cavidades_id
         LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id`
      const [result, count] = await Promise.all([
        pool.query<PlateDto>(`SELECT ${plateColumns} ${from} WHERE ${where} ORDER BY p.placa_id LIMIT $4 OFFSET $5`, [...params, pageSize, offset]),
        pool.query<{ total: string }>(`SELECT count(*)::text AS total ${from} WHERE ${where}`, params),
      ])
      return { data: result.rows, total: Number(count.rows[0]?.total ?? 0) }
    },
    async getPlate(id) {
      const result = await pool.query<PlateDto>(`SELECT ${plateColumns} FROM public.placa p
         LEFT JOIN public.coleccion c ON c.coleccion_id = p.coleccion_id
         LEFT JOIN public.cat_clase_placa cp ON cp.clase_placa_id = p.clase_placa_id
         LEFT JOIN public.cat_diseno_placa dp ON dp.diseno_placa_id = p.diseno_placa_id
         LEFT JOIN public.cat_configuracion_cavidades cc ON cc.configuracion_cavidades_id = p.configuracion_cavidades_id
         LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id
        WHERE p.placa_id = $1`, [id])
      return result.rows[0] ?? null
    },
    async createPlate(input) {
      const entries = (Object.keys(plateMutationColumns) as Array<keyof PlateMutationInput>).filter(column => input[column] !== undefined)
      const values = entries.map(column => input[column])
      const result = await pool.query<{ placa_id: string }>(`INSERT INTO public.placa (${entries.map(column => plateMutationColumns[column]).join(', ')}) VALUES (${entries.map((_, index) => `$${index + 1}`).join(', ')}) RETURNING placa_id::text AS placa_id`, values)
      return (await getPlate(pool, result.rows[0].placa_id))!
    },
    async updatePlate(id, input, user) {
      const entries = (Object.keys(plateMutationColumns) as Array<keyof PlateMutationInput>).filter(column => input[column] !== undefined)
      const values = entries.map(column => input[column])
      const catalogadorOnly = user.roles.some(role => role.trim().toLowerCase() === 'catalogador') && !user.roles.some(role => ['revisor', 'curador', 'administrador'].includes(role.trim().toLowerCase()))
      const idParameter = values.length + 1
      const parameters = [...values, id]
      const ownerClause = catalogadorOnly ? ` AND catalogador_id = $${parameters.length + 1}` : ''
      if (catalogadorOnly) parameters.push(user.personaId)
      const result = await pool.query(`UPDATE public.placa SET ${entries.map((column, index) => `${plateMutationColumns[column]} = $${index + 1}`).join(', ')} WHERE placa_id = $${idParameter}${ownerClause}`, parameters)
      return result.rowCount === 1 ? getPlate(pool, id) : null
    },
    async transitionPlate(id, targetStateId, user) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const current = await client.query<{ estado: string; catalogador_id: string | null }>(`SELECT ec.estado, p.catalogador_id::text AS catalogador_id FROM public.placa p JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id WHERE p.placa_id = $1 FOR UPDATE`, [id])
        if (!current.rows[0]) { await client.query('ROLLBACK'); return null }
        const target = await client.query<{ estado: string }>('SELECT estado FROM public.cat_estado_catalogacion WHERE estado_catalogacion_id = $1', [targetStateId])
        if (!target.rows[0]) throw new InvalidPlateTransitionError('Unknown target state')
        const allowed: Record<string, string[]> = { 'En proceso': ['Incompleto', 'En revisión'], 'Incompleto': ['En proceso'], 'En revisión': ['Incompleto', 'Validado'], 'Validado': ['En proceso', 'Cerrado'], Cerrado: [] }
        if (!allowed[current.rows[0].estado]?.includes(target.rows[0].estado)) throw new InvalidPlateTransitionError('Invalid state transition')
        const review = ['En revisión', 'Validado', 'Cerrado'].includes(current.rows[0].estado) || ['En revisión', 'Validado', 'Cerrado'].includes(target.rows[0].estado)
        const roles = review ? ['Revisor', 'Curador', 'Administrador'] : ['Catalogador', 'Curador', 'Administrador']
        if (!user.roles.some(role => roles.some(required => required.toLowerCase() === role.trim().toLowerCase()))) throw new PlateAuthorizationError('Role cannot transition this state')
        const catalogadorOnly = user.roles.some(role => role.trim().toLowerCase() === 'catalogador') && !user.roles.some(role => ['revisor', 'curador', 'administrador'].includes(role.trim().toLowerCase()))
        if (catalogadorOnly && current.rows[0].catalogador_id !== user.personaId) throw new PlateAuthorizationError('Catalogador can only transition owned plates')
        await client.query('UPDATE public.placa SET estado_catalogacion_id = $1, revisor_id = CASE WHEN $2 THEN $3 ELSE revisor_id END, fecha_revision = CASE WHEN $2 THEN now() ELSE fecha_revision END WHERE placa_id = $4', [targetStateId, review, user.personaId, id])
        // The local schema intentionally has no auditoria_cambios table yet; audit remains pending.
        const updated = await getPlate(client, id)
        await client.query('COMMIT')
        return updated
      } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
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
    async createSample(input) {
      const entries = (Object.keys(sampleMutationColumns) as Array<keyof SampleMutationInput>).filter(column => input[column] !== undefined)
      const values = entries.map(column => input[column])
      const result = await pool.query<{ muestra_id: string }>(`INSERT INTO public.muestra (${entries.map(column => sampleMutationColumns[column]).join(', ')}) VALUES (${entries.map((_, index) => `$${index + 1}`).join(', ')}) RETURNING muestra_id::text AS muestra_id`, values)
      return (await this.getSample(result.rows[0].muestra_id))!
    },
    async updateSample(id, input, user) {
      const entries = (Object.keys(sampleMutationColumns) as Array<keyof SampleMutationInput>).filter(column => input[column] !== undefined)
      const values = entries.map(column => input[column])
      const catalogadorOnly = user.roles.some(role => role.trim().toLowerCase() === 'catalogador') && !user.roles.some(role => ['revisor', 'curador', 'administrador'].includes(role.trim().toLowerCase()))
      const parameters = [...values, id] as unknown[]
      const ownerClause = catalogadorOnly ? ` AND catalogador_id = $${parameters.length + 1}` : ''
      if (catalogadorOnly) parameters.push(user.personaId)
      const result = await pool.query(`UPDATE public.muestra SET ${entries.map((column, index) => `${sampleMutationColumns[column]} = $${index + 1}`).join(', ')} WHERE muestra_id = $${values.length + 1}${ownerClause}`, parameters)
      return result.rowCount === 1 ? this.getSample(id) : null
    },
    async deleteSample(id) {
      const result = await pool.query('DELETE FROM public.muestra WHERE muestra_id = $1', [id])
      return result.rowCount === 1
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
      const [kpis, estados, placasPorColeccion, ocupacion, problemas] = await Promise.all([
        pool.query<DashboardKpisDto>(`SELECT
          count(*) FILTER (WHERE true)::int AS "totalPlacas",
          (SELECT count(*)::int FROM public.muestra) AS "totalMuestras",
          (SELECT count(*)::int FROM public.coleccion) AS "totalColecciones",
          count(*) FILTER (WHERE ec.estado = 'Validado')::int AS "placasValidadas",
          (SELECT count(*)::int FROM public.ubicacion_fisica WHERE placa_id IS NULL) AS "ubicacionesDisponibles"
        FROM public.placa p
        LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id`),
        pool.query<DashboardEstadoDto>(`SELECT coalesce(ec.estado, 'Sin estado') AS name, count(*)::int AS value
          FROM public.placa p
          LEFT JOIN public.cat_estado_catalogacion ec ON ec.estado_catalogacion_id = p.estado_catalogacion_id
          GROUP BY ec.estado
          ORDER BY value DESC, name`),
        pool.query(`SELECT coalesce(c.nombre_coleccion, 'Sin colección') AS name, count(*)::int AS value
          FROM public.placa p
          LEFT JOIN public.coleccion c ON c.coleccion_id = p.coleccion_id
          GROUP BY coalesce(c.nombre_coleccion, 'Sin colección')
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
       const totals = kpis.rows[0] ?? { totalPlacas: 0, totalMuestras: 0, totalColecciones: 0, placasValidadas: 0, ubicacionesDisponibles: 0 }
      return {
        kpis: { ...totals, placasValidadas: totals.totalPlacas ? Math.round((totals.placasValidadas / totals.totalPlacas) * 100) : 0 },
        estadoCatalogacion: estados.rows,
        placasPorColeccion: placasPorColeccion.rows,
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
