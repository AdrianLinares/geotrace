import Fastify, { type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import { ZodError } from 'zod'
import type { AppConfig } from './config'
import { AuthService, AuthenticationInfrastructureError, InvalidCredentialsError, MissingApplicationRoleError, requireRole } from './auth'
import { InvalidPlateTransitionError, LastAdministratorError, PlateAuthorizationError, UnknownRoleError } from './repositories'
import type { AuthenticatedUser, CollectionInput, CollectionRepository, CollectionUpdateInput, AdminRepository, ConservationRepository, PlateRepository, ImportRepository, CatalogRepository, AuditRepository } from './types'
import { basinQuerySchema, catalogReferenceQuerySchema, collectionBodySchema, collectionCreateBodySchema, collectionIdSchema, collectionQuerySchema, completeCollectionInput, normalizedIdSchema, personIdSchema, personUpdateSchema, physicalLocationQuerySchema, plateCreateSchema, plateQuerySchema, plateTransitionSchema, plateUpdateSchema, sampleCreateSchema, sampleQuerySchema, sampleUpdateSchema, wellQuerySchema } from './validation'
import { importBodySchema, IMPORT_MAX_BYTES } from './importValidation'

type Dependencies = { auth: AuthService; config: AppConfig; databaseHealth?: () => Promise<void>; reads?: PlateRepository; admin?: AdminRepository; imports?: ImportRepository; conservation?: ConservationRepository; catalogs?: CatalogRepository; audit?: AuditRepository }

export async function createApp({ auth, config, databaseHealth, reads, admin, imports, conservation, catalogs, audit }: Dependencies): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.NODE_ENV !== 'test' })
  await app.register(cookie)
  const cookieOptions = {
    httpOnly: true,
    sameSite: config.SESSION_COOKIE_SAME_SITE,
    secure: config.SESSION_COOKIE_SECURE,
    domain: config.SESSION_COOKIE_DOMAIN,
    path: '/',
    maxAge: config.SESSION_TTL_SECONDS,
  } as const
  const readUser = (request: { cookies: Record<string, string | undefined> }) => auth.restore(request.cookies[config.SESSION_COOKIE_NAME])
  const clearSessionCookie = (reply: { clearCookie: (name: string, options: typeof cookieOptions) => unknown }) => reply.clearCookie(config.SESSION_COOKIE_NAME, cookieOptions)

  app.setErrorHandler((error, _request, reply) => {
    if ((error as { statusCode?: number }).statusCode === 413) return reply.code(413).send({ error: 'Import payload is too large' })
    if (error instanceof AuthenticationInfrastructureError) return reply.code(503).send({ error: 'Authentication service unavailable' })
    if (error instanceof LastAdministratorError) return reply.code(409).send({ error: 'The last administrator cannot be removed' })
    if (error instanceof UnknownRoleError) return reply.code(404).send({ error: 'Application role not found' })
    if (error instanceof PlateAuthorizationError) return reply.code(403).send({ error: error.message })
    if (error instanceof InvalidPlateTransitionError) return reply.code(409).send({ error: error.message })
    if ((error as { code?: string }).code === '23505' || (error as { code?: string }).code === '23503') return reply.code(409).send({ error: 'Import conflicts with an existing record or reference' })
    if (error instanceof ZodError) return reply.code(400).send({ error: 'Invalid request' })
    return reply.code(500).send({ error: 'Internal server error' })
  })

  app.get('/health', async (_request, reply) => {
    try {
      await databaseHealth?.()
      return { status: 'ok' }
    } catch {
      return reply.code(503).send({ status: 'unavailable' })
    }
  })
  app.post<{ Body: { username?: string; password?: string } }>('/auth/login', async (request, reply) => {
    const { username, password } = request.body ?? {}
    if (!username || !password) return reply.code(400).send({ error: 'username and password are required' })
    try {
      const result = await auth.login(username, password)
      await audit?.record({ tabla: 'app_auth_sessions', operacion: 'LOGIN', registroId: result.user.personaId, user: result.user, cambios: { method: result.local ? 'local' : 'directory' } })
      reply.setCookie(config.SESSION_COOKIE_NAME, result.token, cookieOptions)
      return { user: result.user }
    } catch (error) {
       if (error instanceof InvalidCredentialsError || error instanceof MissingApplicationRoleError) return reply.code(401).send({ error: 'Authentication rejected' })
       if (error instanceof AuthenticationInfrastructureError) return reply.code(503).send({ error: 'Authentication service unavailable' })
      throw error
    }
  })
  app.get('/auth/me', async (request, reply) => {
    const user = await readUser(request)
     if (!user) {
       clearSessionCookie(reply)
       return reply.code(401).send({ error: 'Authentication required' })
     }
    return { user }
  })
  app.post('/auth/logout', async (request, reply) => {
    const user = await readUser(request)
    await auth.logout(request.cookies[config.SESSION_COOKIE_NAME])
    await audit?.record({ tabla: 'app_auth_sessions', operacion: 'LOGOUT', registroId: user?.personaId, user })
    reply.clearCookie(config.SESSION_COOKIE_NAME, cookieOptions)
    return { ok: true }
  })
  const requireSession = async (request: { cookies: Record<string, string | undefined> }, reply: { code: (status: number) => { send: (body: unknown) => unknown }; clearCookie: (name: string, options: typeof cookieOptions) => unknown }) => {
    const user = await readUser(request)
    if (!user) {
      clearSessionCookie(reply)
      reply.code(401).send({ error: 'Authentication required' })
      return null
    }
    return user
  }
  const requireAdministrator = async (request: { cookies: Record<string, string | undefined> }, reply: Parameters<typeof requireSession>[1]) => {
    const user = await requireSession(request, reply)
    if (!user) return null
    if (!requireRole('Administrador')(user)) {
      reply.code(403).send({ error: 'Administrator role required' })
      return null
    }
    return user
  }
  const requireCatalogReferenceAccess = async (request: { cookies: Record<string, string | undefined> }, reply: Parameters<typeof requireSession>[1]) => {
    const user = await requireSession(request, reply)
    if (!user) return null
    if (!requireRole('Curador')(user) && !requireRole('Administrador')(user)) {
      reply.code(403).send({ error: 'Forbidden' })
      return null
    }
    return user
  }
  if (admin) {
    app.get('/api/admin/personas', async (request, reply) => {
      if (!(await requireAdministrator(request, reply))) return
      return { data: await admin.listPeople() }
    })
    app.get('/api/admin/roles', async (request, reply) => {
      if (!(await requireAdministrator(request, reply))) return
      return { data: await admin.listRoles() }
    })
    app.put<{ Params: { id: string } }>('/api/admin/personas/:id', async (request, reply) => {
      if (!(await requireAdministrator(request, reply))) return
      const id = personIdSchema.parse(request.params.id)
      const input = personUpdateSchema.parse(request.body)
      const person = await admin.updatePerson(id, input)
      if (!person) return reply.code(404).send({ error: 'Person not found' })
      await audit?.record({ tabla: 'persona', operacion: 'UPDATE', registroId: id, user: await readUser(request), cambios: input })
      return person
    })
    app.get('/api/admin/audit', async (request, reply) => {
      if (!(await requireAdministrator(request, reply))) return
      return { data: await audit?.list(100) ?? [] }
    })
  }
  if (imports) {
    app.post<{ Body: unknown }>('/api/admin/import', { bodyLimit: IMPORT_MAX_BYTES }, async (request, reply) => {
      if (!(await requireAdministrator(request, reply))) return
      const body = importBodySchema.parse(request.body)
      const imported = await imports.importBatches(body.batches)
      await audit?.record({ tabla: 'import', operacion: 'IMPORT', user: await readUser(request), cambios: { batches: body.batches.map(batch => ({ table: batch.table, rows: batch.rows.length })), imported } })
      return { imported }
    })
  }
  if (reads) {
    app.get<{ Querystring: { page?: string; pageSize?: string; search?: string } }>('/api/collections', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const query = collectionQuerySchema.parse(request.query)
      const result = await reads.listCollections(query.page, query.pageSize, query.search)
      return result
    })
    app.post<{ Body: CollectionInput }>('/api/collections', async (request, reply) => {
      const user = await requireSession(request, reply); if (!user) return
      const body = collectionCreateBodySchema.parse(request.body)
      const result = await reads.createCollection(completeCollectionInput(body))
      await audit?.record({ tabla: 'coleccion', operacion: 'INSERT', registroId: result.coleccion_id, user, cambios: result })
      return reply.code(201).send(result)
    })
    app.put<{ Params: { id: string }; Body: CollectionUpdateInput }>('/api/collections/:id', async (request, reply) => {
      const user = await requireSession(request, reply); if (!user) return
      const id = collectionIdSchema.parse(request.params.id)
      const body = collectionBodySchema.parse(request.body)
      const result = await reads.updateCollection(id, body)
       if (!result) return reply.code(404).send({ error: 'Collection not found' })
       await audit?.record({ tabla: 'coleccion', operacion: 'UPDATE', registroId: id, user, cambios: body })
       return result
    })
    app.delete<{ Params: { id: string } }>('/api/collections/:id', async (request, reply) => {
      const user = await requireSession(request, reply); if (!user) return
      const id = collectionIdSchema.parse(request.params.id)
      const deleted = await reads.deleteCollection(id)
       if (!deleted) return reply.code(404).send({ error: 'Collection not found' })
       await audit?.record({ tabla: 'coleccion', operacion: 'DELETE', registroId: id, user })
       return { ok: true }
    })
    app.get<{ Params: { id: string } }>('/api/collections/:id', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const id = collectionIdSchema.parse(request.params.id)
      const result = await reads.getCollection(id)
      return result ?? reply.code(404).send({ error: 'Collection not found' })
    })
    app.get<{ Querystring: { page?: string; pageSize?: string; search?: string } }>('/api/wells', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const query = wellQuerySchema.parse(request.query)
      const result = await reads.listWells(query.page, query.pageSize, query.search)
      return result
    })
    app.get<{ Params: { id: string } }>('/api/wells/:id', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const id = collectionIdSchema.parse(request.params.id)
      const result = await reads.getWell(id)
      return result ?? reply.code(404).send({ error: 'Well not found' })
    })
    app.get('/api/reference/basins', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      basinQuerySchema.parse(request.query)
      const result = { data: await reads.listBasins() }
      return result
    })
    app.get<{ Querystring: { page?: string; pageSize?: string; search?: string; collectionId?: string; states?: string } }>('/api/plates', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const query = plateQuerySchema.parse(request.query)
      return reads.listPlates(query.page, query.pageSize, { collectionId: query.collectionId, states: query.states, search: query.search })
    })
    app.get<{ Params: { id: string } }>('/api/plates/:id', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const id = normalizedIdSchema.parse(request.params.id)
      const result = await reads.getPlate(id)
      return result ?? reply.code(404).send({ error: 'Plate not found' })
    })
    app.post<{ Body: unknown }>('/api/plates', async (request, reply) => {
      const user = await requireSession(request, reply); if (!user) return
       if (!requireRole('Catalogador')(user) && !requireRole('Curador')(user) && !requireRole('Administrador')(user)) return reply.code(403).send({ error: 'Plate creation role required' })
      const input = plateCreateSchema.parse(request.body)
       if ((input.revisor_id !== undefined || input.fecha_revision !== undefined || input.estado_revision_id !== undefined) && !requireRole('Revisor')(user) && !requireRole('Curador')(user) && !requireRole('Administrador')(user)) return reply.code(403).send({ error: 'Review fields require a reviewer role' })
       const result = await reads.createPlate({ ...input, catalogador_id: user.personaId, fecha_ingreso: input.fecha_ingreso ?? new Date().toISOString() })
       await audit?.record({ tabla: 'placa', operacion: 'INSERT', registroId: result.placa_id, user, cambios: result })
       return reply.code(201).send(result)
    })
    app.put<{ Params: { id: string }; Body: unknown }>('/api/plates/:id', async (request, reply) => {
      const user = await requireSession(request, reply); if (!user) return
       if (!requireRole('Catalogador')(user) && !requireRole('Revisor')(user) && !requireRole('Curador')(user) && !requireRole('Administrador')(user)) return reply.code(403).send({ error: 'Plate editing role required' })
       const id = normalizedIdSchema.parse(request.params.id)
       const input = plateUpdateSchema.parse(request.body)
       if (input.estado_catalogacion_id !== undefined) return reply.code(400).send({ error: 'Use the status transition endpoint for catalogation state changes' })
       if (input.catalogador_id !== undefined) return reply.code(400).send({ error: 'Plate ownership cannot be changed' })
       if ((input.revisor_id !== undefined || input.fecha_revision !== undefined || input.estado_revision_id !== undefined) && !requireRole('Revisor')(user) && !requireRole('Curador')(user) && !requireRole('Administrador')(user)) return reply.code(403).send({ error: 'Review fields require a reviewer role' })
       const current = await reads.getPlate(id)
       if (!current) return reply.code(404).send({ error: 'Plate not found' })
       if (requireRole('Catalogador')(user) && !requireRole('Revisor')(user) && !requireRole('Curador')(user) && !requireRole('Administrador')(user) && current.catalogador_id !== user.personaId) return reply.code(403).send({ error: 'Catalogador can only edit owned plates' })
       const result = await reads.updatePlate(id, input, user)
       if (result) await audit?.record({ tabla: 'placa', operacion: 'UPDATE', registroId: id, user, cambios: input })
       return result ?? reply.code(404).send({ error: 'Plate not found' })
    })
    app.post<{ Params: { id: string }; Body: unknown }>('/api/plates/:id/status', async (request, reply) => {
      const user = await requireSession(request, reply); if (!user) return
      const id = normalizedIdSchema.parse(request.params.id)
      const { estado_catalogacion_id } = plateTransitionSchema.parse(request.body)
       const result = await reads.transitionPlate(id, estado_catalogacion_id, user)
       if (result) await audit?.record({ tabla: 'placa', operacion: 'UPDATE', registroId: id, user, cambios: { estado_catalogacion_id } })
       return result ?? reply.code(404).send({ error: 'Plate not found' })
    })
    app.get<{ Querystring: { page?: string; pageSize?: string; placaId?: string } }>('/api/samples', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const query = sampleQuerySchema.parse(request.query)
      if (query.placaId) return reply.code(400).send({ error: 'The normalized schema has no MUESTRA-to-PLACA relationship' })
      return reads.listSamples(query.page, query.pageSize)
    })
    app.get<{ Params: { id: string } }>('/api/samples/:id', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const id = normalizedIdSchema.parse(request.params.id)
      const result = await reads.getSample(id)
      return result ?? reply.code(404).send({ error: 'Sample not found' })
    })
    app.post<{ Body: unknown }>('/api/samples', async (request, reply) => {
      const user = await requireSession(request, reply); if (!user) return
      if (!requireRole('Catalogador')(user) && !requireRole('Curador')(user) && !requireRole('Administrador')(user)) return reply.code(403).send({ error: 'Sample creation role required' })
      const input = sampleCreateSchema.parse(request.body)
      if ((input.revisor_id !== undefined || input.fecha_revision !== undefined || input.estado_catalogacion_id !== undefined) && !requireRole('Revisor')(user) && !requireRole('Curador')(user) && !requireRole('Administrador')(user)) return reply.code(403).send({ error: 'Review fields require a reviewer role' })
       const result = await reads.createSample({ ...input, catalogador_id: user.personaId, fecha_ingreso: input.fecha_ingreso ?? new Date().toISOString() })
       await audit?.record({ tabla: 'muestra', operacion: 'INSERT', registroId: result.muestra_id, user, cambios: result })
       return reply.code(201).send(result)
    })
    app.put<{ Params: { id: string }; Body: unknown }>('/api/samples/:id', async (request, reply) => {
      const user = await requireSession(request, reply); if (!user) return
      if (!requireRole('Catalogador')(user) && !requireRole('Revisor')(user) && !requireRole('Curador')(user) && !requireRole('Administrador')(user)) return reply.code(403).send({ error: 'Sample editing role required' })
      const id = normalizedIdSchema.parse(request.params.id)
      const input = sampleUpdateSchema.parse(request.body)
      if (input.catalogador_id !== undefined) return reply.code(400).send({ error: 'Sample ownership cannot be changed' })
      if ((input.revisor_id !== undefined || input.fecha_revision !== undefined || input.estado_catalogacion_id !== undefined) && !requireRole('Revisor')(user) && !requireRole('Curador')(user) && !requireRole('Administrador')(user)) return reply.code(403).send({ error: 'Review fields require a reviewer role' })
      const current = await reads.getSample(id)
      if (!current) return reply.code(404).send({ error: 'Sample not found' })
      if (requireRole('Catalogador')(user) && !requireRole('Revisor')(user) && !requireRole('Curador')(user) && !requireRole('Administrador')(user) && current.catalogador_id !== user.personaId) return reply.code(403).send({ error: 'Catalogador can only edit owned samples' })
       const result = await reads.updateSample(id, input, user)
       if (result) await audit?.record({ tabla: 'muestra', operacion: 'UPDATE', registroId: id, user, cambios: input })
       return result ?? reply.code(404).send({ error: 'Sample not found' })
    })
    app.delete<{ Params: { id: string } }>('/api/samples/:id', async (request, reply) => {
      const user = await requireSession(request, reply); if (!user) return
      if (!requireRole('Curador')(user) && !requireRole('Administrador')(user)) return reply.code(403).send({ error: 'Only curators and administrators can delete samples' })
      const id = normalizedIdSchema.parse(request.params.id)
      const deleted = await reads.deleteSample(id)
       if (!deleted) return reply.code(404).send({ error: 'Sample not found' })
       await audit?.record({ tabla: 'muestra', operacion: 'DELETE', registroId: id, user })
       return { ok: true }
    })
    app.get<{ Querystring: { page?: string; pageSize?: string; search?: string; occupied?: string; sectionId?: string } }>('/api/physical-locations', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const query = physicalLocationQuerySchema.parse(request.query)
      return reads.listPhysicalLocations(query.page, query.pageSize, { search: query.search, occupied: query.occupied, sectionId: query.sectionId })
    })
    app.get<{ Params: { id: string } }>('/api/physical-locations/:id', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const id = normalizedIdSchema.parse(request.params.id)
      const result = await reads.getPhysicalLocation(id)
      return result ?? reply.code(404).send({ error: 'Physical location not found' })
    })
    app.get('/api/dashboard', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      return reads.getDashboard()
    })
  }
  if (conservation) {
    app.get('/api/reference/conservation', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      return { data: await conservation.listStates() }
    })
  }
  if (catalogs) {
    app.get('/api/reference/catalogs', async (request, reply) => {
      if (!(await requireCatalogReferenceAccess(request, reply))) return
      catalogReferenceQuerySchema.parse(request.query)
      return { data: await catalogs.listReferences() }
    })
  }
  return app
}

export type RequestUser = AuthenticatedUser
