import { Pool } from 'pg'
import { loadConfig } from './config'
import { createApp } from './app'
import { createDirectoryAuthenticator } from './ldap'
import { createAdminRepository, createCatalogRepository, createConservationRepository, createImportRepository, createReadRepository, createRoleRepository, createSessionRepository } from './repositories'
import { AuthService } from './auth'
import { createLocalCredentialRepository } from './localAdmin'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createAuditRepository } from './audit'

export async function main(): Promise<void> {
  let app: Awaited<ReturnType<typeof createApp>> | undefined
  let directory: ReturnType<typeof createDirectoryAuthenticator> | undefined
  let pool: Pool | undefined
  let closePromise: Promise<void> | undefined

  const close = async (): Promise<void> => {
    if (closePromise) return closePromise
    closePromise = (async () => {
      try {
        await app?.close()
      } finally {
        try {
          await directory?.close()
        } finally {
          await pool?.end()
        }
      }
    })()
    return closePromise
  }

  try {
    const config = loadConfig()
    pool = new Pool({ connectionString: config.DATABASE_URL })
    directory = createDirectoryAuthenticator(config)
    const auth = new AuthService(directory, createRoleRepository(pool), createSessionRepository(pool), config.SESSION_TTL_SECONDS, config.LOCAL_ADMIN_ENABLED ? { username: config.LOCAL_ADMIN_USERNAME!, credentials: createLocalCredentialRepository(pool) } : undefined)
    app = await createApp({ auth, config, reads: createReadRepository(pool), admin: createAdminRepository(pool), imports: createImportRepository(pool), conservation: createConservationRepository(pool), catalogs: createCatalogRepository(pool), audit: createAuditRepository(pool), databaseHealth: () => pool!.query('SELECT 1').then(() => undefined) })

    const handleSignal = () => {
      void close().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error)
        process.exitCode = 1
      })
    }
    process.once('SIGTERM', handleSignal)
    process.once('SIGINT', handleSignal)
    await app.listen({ host: config.SERVER_HOST, port: config.SERVER_PORT })
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
    await close().catch((closeError: unknown) => {
      console.error(closeError instanceof Error ? closeError.message : closeError)
      process.exitCode = 1
    })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main()
}
