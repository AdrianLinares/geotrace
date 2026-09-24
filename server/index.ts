import { Pool } from 'pg'
import { loadConfig } from './config'
import { createApp } from './app'
import { createLdapAuthenticator } from './ldap'
import { createAdminRepository, createCatalogRepository, createConservationRepository, createImportRepository, createReadRepository, createRoleRepository, createSessionRepository } from './repositories'
import { AuthService } from './auth'
import { createLocalCredentialRepository } from './localAdmin'

const config = loadConfig()
const pool = new Pool({ connectionString: config.DATABASE_URL })
const directory = createLdapAuthenticator(config)
const auth = new AuthService(directory, createRoleRepository(pool), createSessionRepository(pool), config.SESSION_TTL_SECONDS, config.LOCAL_ADMIN_ENABLED ? { username: config.LOCAL_ADMIN_USERNAME!, credentials: createLocalCredentialRepository(pool) } : undefined)
  const app = await createApp({ auth, config, reads: createReadRepository(pool), admin: createAdminRepository(pool), imports: createImportRepository(pool), conservation: createConservationRepository(pool), catalogs: createCatalogRepository(pool), databaseHealth: () => pool.query('SELECT 1').then(() => undefined) })

const close = async () => {
  await app.close()
  await directory.close()
  await pool.end()
}
process.once('SIGTERM', close)
process.once('SIGINT', close)
await app.listen({ host: config.SERVER_HOST, port: config.SERVER_PORT })
