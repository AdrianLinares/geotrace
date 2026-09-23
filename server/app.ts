import Fastify, { type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import type { AppConfig } from './config'
import { AuthService, AuthenticationInfrastructureError, InvalidCredentialsError, MissingApplicationRoleError } from './auth'
import type { AuthenticatedUser } from './types'

type Dependencies = { auth: AuthService; config: AppConfig; databaseHealth?: () => Promise<void> }

export async function createApp({ auth, config, databaseHealth }: Dependencies): Promise<FastifyInstance> {
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
  return app
}

export type RequestUser = AuthenticatedUser
