import { z } from 'zod'
import { isValidPasswordHash } from './passwords'

const booleanFromEnv = z.enum(['true', 'false']).transform((value) => value === 'true')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVER_HOST: z.string().default('127.0.0.1'),
  SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  LDAP_URL: z.string().url().optional(),
  LDAP_STARTTLS: booleanFromEnv.default('false'),
  LDAP_BASE_DN: z.string().min(1).optional(),
  LDAP_BIND_DN: z.string().optional(),
  LDAP_BIND_PASSWORD: z.string().optional(),
  LDAP_USER_SEARCH_FILTER: z.string().default('(|(sAMAccountName={{username}})(userPrincipalName={{username}})(mail={{username}}))'),
  SESSION_COOKIE_NAME: z.string().default('geotrace_session'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(28800),
  SESSION_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  SESSION_COOKIE_SECURE: booleanFromEnv.default('false'),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
  LOCAL_ADMIN_ENABLED: booleanFromEnv.default('false'),
  LOCAL_ADMIN_USERNAME: z.string().min(1).optional(),
  LOCAL_ADMIN_PASSWORD_HASH: z.string().min(1).optional(),
})

export type AppConfig = z.infer<typeof envSchema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (env.NODE_ENV === 'production' && env.LOCAL_ADMIN_ENABLED === 'true') {
    throw new Error('LOCAL_ADMIN_ENABLED=true is not permitted when NODE_ENV=production; use AD authentication in production')
  }
  const result = envSchema.safeParse(env)
  if (!result.success) {
    throw new Error(`Invalid server configuration: ${result.error.issues.map((issue) => issue.path.join('.') + ' ' + issue.message).join('; ')}`)
  }
  const ldapConfigured = Boolean(result.data.LDAP_URL || result.data.LDAP_BASE_DN)
  const localOnly = result.data.NODE_ENV !== 'production' && result.data.LOCAL_ADMIN_ENABLED
  if (ldapConfigured && (!result.data.LDAP_URL || !result.data.LDAP_BASE_DN)) {
    throw new Error('LDAP_URL and LDAP_BASE_DN must be provided together')
  }
  if (!ldapConfigured && !localOnly) {
    throw new Error('LDAP_URL and LDAP_BASE_DN are required unless LOCAL_ADMIN_ENABLED=true in development or test')
  }
  if ((result.data.LDAP_BIND_DN && !result.data.LDAP_BIND_PASSWORD) || (!result.data.LDAP_BIND_DN && result.data.LDAP_BIND_PASSWORD)) {
    throw new Error('LDAP_BIND_DN and LDAP_BIND_PASSWORD must be provided together')
  }
  const ldapProtocol = result.data.LDAP_URL ? new URL(result.data.LDAP_URL).protocol : undefined
  if (result.data.NODE_ENV === 'production' && ldapProtocol !== 'ldaps:' && !(ldapProtocol === 'ldap:' && result.data.LDAP_STARTTLS)) {
    throw new Error('Production LDAP must use ldaps:// or LDAP_STARTTLS=true with ldap://')
  }
  if (result.data.SESSION_COOKIE_SAME_SITE === 'none' && !result.data.SESSION_COOKIE_SECURE) {
    throw new Error('SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAME_SITE is none')
  }
  if (result.data.LOCAL_ADMIN_ENABLED && (!result.data.LOCAL_ADMIN_USERNAME || !result.data.LOCAL_ADMIN_PASSWORD_HASH || !isValidPasswordHash(result.data.LOCAL_ADMIN_PASSWORD_HASH))) {
    throw new Error('LOCAL_ADMIN_USERNAME and LOCAL_ADMIN_PASSWORD_HASH are required and valid when LOCAL_ADMIN_ENABLED=true')
  }
  return result.data
}
