import Fastify, { type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import { ZodError } from 'zod'
import type { AppConfig } from './config'
import { AuthService, AuthenticationInfrastructureError, InvalidCredentialsError, MissingApplicationRoleError } from './auth'
import type { AuthenticatedUser, CollectionInput, CollectionRepository, CollectionUpdateInput } from './types'
import { basinQuerySchema, collectionBodySchema, collectionCreateBodySchema, collectionIdSchema, collectionQuerySchema, completeCollectionInput, normalizedIdSchema, plateQuerySchema, sampleQuerySchema, wellQuerySchema } from './validation'

type Dependencies = { auth: AuthService; config: AppConfig; databaseHealth?: () => Promise<void>; reads?: CollectionRepository }

export async function createApp({ auth, config, databaseHealth, reads }: Dependencies): Promise<FastifyInstance> {
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
    if (error instanceof AuthenticationInfrastructureError) return reply.code(503).send({ error: 'Authentication service unavailable' })
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
    await auth.logout(request.cookies[config.SESSION_COOKIE_NAME])
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
  if (reads) {
    app.get<{ Querystring: { page?: string; pageSize?: string; search?: string } }>('/api/collections', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const query = collectionQuerySchema.parse(request.query)
      const result = await reads.listCollections(query.page, query.pageSize, query.search)
      return result
    })
    app.post<{ Body: CollectionInput }>('/api/collections', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const body = collectionCreateBodySchema.parse(request.body)
      return reply.code(201).send(await reads.createCollection(completeCollectionInput(body)))
    })
    app.put<{ Params: { id: string }; Body: CollectionUpdateInput }>('/api/collections/:id', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const id = collectionIdSchema.parse(request.params.id)
      const body = collectionBodySchema.parse(request.body)
      const result = await reads.updateCollection(id, body)
      return result ?? reply.code(404).send({ error: 'Collection not found' })
    })
    app.delete<{ Params: { id: string } }>('/api/collections/:id', async (request, reply) => {
      if (!(await requireSession(request, reply))) return
      const id = collectionIdSchema.parse(request.params.id)
      const deleted = await reads.deleteCollection(id)
      return deleted ? { ok: true } : reply.code(404).send({ error: 'Collection not found' })
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
  }
  return app
}

export type RequestUser = AuthenticatedUser
