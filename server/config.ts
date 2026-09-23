import { z } from 'zod'

const booleanFromEnv = z.enum(['true', 'false']).transform((value) => value === 'true')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVER_HOST: z.string().default('127.0.0.1'),
  SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  LDAP_URL: z.string().url(),
  LDAP_STARTTLS: booleanFromEnv.default('false'),
  LDAP_BASE_DN: z.string().min(1),
  LDAP_BIND_DN: z.string().optional(),
  LDAP_BIND_PASSWORD: z.string().optional(),
  LDAP_USER_SEARCH_FILTER: z.string().default('(|(sAMAccountName={{username}})(userPrincipalName={{username}})(mail={{username}}))'),
  SESSION_COOKIE_NAME: z.string().default('geotrace_session'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(28800),
  SESSION_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  SESSION_COOKIE_SECURE: booleanFromEnv.default('false'),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
})

export type AppConfig = z.infer<typeof envSchema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    throw new Error(`Invalid server configuration: ${result.error.issues.map((issue) => issue.path.join('.') + ' ' + issue.message).join('; ')}`)
  }
  if ((result.data.LDAP_BIND_DN && !result.data.LDAP_BIND_PASSWORD) || (!result.data.LDAP_BIND_DN && result.data.LDAP_BIND_PASSWORD)) {
    throw new Error('LDAP_BIND_DN and LDAP_BIND_PASSWORD must be provided together')
  }
  const ldapProtocol = new URL(result.data.LDAP_URL).protocol
  if (result.data.NODE_ENV === 'production' && ldapProtocol !== 'ldaps:' && !(ldapProtocol === 'ldap:' && result.data.LDAP_STARTTLS)) {
    throw new Error('Production LDAP must use ldaps:// or LDAP_STARTTLS=true with ldap://')
  }
  if (result.data.SESSION_COOKIE_SAME_SITE === 'none' && !result.data.SESSION_COOKIE_SECURE) {
    throw new Error('SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAME_SITE is none')
  }
  return result.data
}
