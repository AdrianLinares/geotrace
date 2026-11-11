import { Client } from 'ldapts'
import type { AppConfig } from './config'
import { escapeLdapFilter } from './security'
import type { DirectoryAuthenticator } from './types'
import { InvalidCredentialsError } from './auth'

export class LdapClientError extends Error {}

type LdapClient = Pick<Client, 'bind' | 'search' | 'startTLS' | 'unbind'>
type LdapClientFactory = (url: string) => LdapClient

function isInvalidCredentials(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: unknown; message?: unknown }
  return candidate.code === 49 || candidate.code === '49' || (typeof candidate.message === 'string' && /invalid credentials/i.test(candidate.message))
}

// LDAP servers are not required to preserve the requested attribute casing, so match case-insensitively.
function readEntryValue(entry: Record<string, unknown> | undefined, names: readonly string[]): string | undefined {
  if (!entry) return undefined
  for (const name of names) {
    const key = Object.keys(entry).find((candidate) => candidate.toLowerCase() === name.toLowerCase())
    if (!key) continue
    const value = entry[key]
    const first = Array.isArray(value) ? value[0] : value
    if (Buffer.isBuffer(first)) return first.toString('utf8').trim() || undefined
    if (typeof first === 'string' && first.trim()) return first.trim()
  }
  return undefined
}

export function createLdapAuthenticator(config: AppConfig, createClient: LdapClientFactory = (url) => new Client({ url, timeout: 5000, connectTimeout: 5000 })): DirectoryAuthenticator {

  return {
    async authenticate(username, password) {
      if (!config.LDAP_URL || !config.LDAP_BASE_DN) throw new LdapClientError('LDAP directory unavailable')
      let client: LdapClient | undefined
      let userBindStarted = false
      try {
        client = createClient(config.LDAP_URL)
        if (new URL(config.LDAP_URL).protocol === 'ldap:' && config.LDAP_STARTTLS) {
          await client.startTLS({ rejectUnauthorized: true })
        }
        if (config.LDAP_BIND_DN && config.LDAP_BIND_PASSWORD) await client.bind(config.LDAP_BIND_DN, config.LDAP_BIND_PASSWORD)
        const filter = config.LDAP_USER_SEARCH_FILTER.split('{{username}}').join(escapeLdapFilter(username))
        const { searchEntries } = await client.search(config.LDAP_BASE_DN, { scope: 'sub', filter, attributes: ['sAMAccountName', 'uid'] })
        const entry = searchEntries[0]
        const userDn = typeof entry?.dn === 'string' ? entry.dn : undefined
        if (!userDn || searchEntries.length !== 1) throw new Error('LDAP user was not uniquely found')
        userBindStarted = true
        await client.bind(userDn, password)
        // sAMAccountName is the canonical Active Directory login; uid covers generic LDAP directories.
        return { login: readEntryValue(entry, ['sAMAccountName', 'uid']) ?? username }
      } catch (error) {
        if (userBindStarted && isInvalidCredentials(error)) throw new InvalidCredentialsError('Invalid credentials')
        throw new LdapClientError('LDAP directory unavailable')
      } finally {
        if (client) await client.unbind().catch(() => undefined)
      }
    },
    async close() {
      // Clients are intentionally scoped to one authentication attempt.
    },
  }
}

export function createUnavailableDirectoryAuthenticator(): DirectoryAuthenticator {
  return {
    async authenticate() {
      throw new LdapClientError('LDAP directory unavailable')
    },
    async close() {},
  }
}

export function createDirectoryAuthenticator(config: AppConfig, createLdap: (config: AppConfig) => DirectoryAuthenticator = createLdapAuthenticator): DirectoryAuthenticator {
  return config.LDAP_URL && config.LDAP_BASE_DN ? createLdap(config) : createUnavailableDirectoryAuthenticator()
}
