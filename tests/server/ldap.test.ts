import { describe, expect, it, vi } from 'vitest'
import { createDirectoryAuthenticator, createLdapAuthenticator, LdapClientError } from '../../server/ldap'
import { InvalidCredentialsError } from '../../server/auth'
import type { AppConfig } from '../../server/config'

const config: AppConfig = {
  NODE_ENV: 'test', SERVER_HOST: '127.0.0.1', SERVER_PORT: 3000,
  DATABASE_URL: 'postgres://localhost/geotrace', LDAP_URL: 'ldap://directory.example.test', LDAP_STARTTLS: true,
  LDAP_BASE_DN: 'dc=example,dc=test', LDAP_USER_SEARCH_FILTER: '(uid={{username}})',
  LDAP_BIND_DN: 'cn=service,dc=example,dc=test', LDAP_BIND_PASSWORD: 'secret',
  SESSION_COOKIE_NAME: 'session', SESSION_TTL_SECONDS: 60, SESSION_COOKIE_SAME_SITE: 'lax', SESSION_COOKIE_SECURE: false,
}

function client() {
  return {
    bind: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue({ searchEntries: [{ dn: 'uid=ada,dc=example,dc=test' }] }),
    startTLS: vi.fn().mockResolvedValue(undefined),
    unbind: vi.fn().mockResolvedValue(undefined),
  }
}

describe('LDAP authenticator', () => {
  it('uses a disabled directory when local-only configuration has no LDAP', async () => {
    const localOnly = { ...config, LDAP_URL: undefined, LDAP_BASE_DN: undefined, LOCAL_ADMIN_ENABLED: true }
    const createLdap = vi.fn()
    const authenticator = createDirectoryAuthenticator(localOnly, createLdap)

    await expect(authenticator.authenticate('local-admin', 'password')).rejects.toBeInstanceOf(LdapClientError)
    expect(createLdap).not.toHaveBeenCalled()
    await authenticator.close()
  })

  it('does not unbind when the LDAP client cannot be created', async () => {
    const authenticator = createLdapAuthenticator(config, () => { throw new Error('client creation failed') })

    await expect(authenticator.authenticate('ada', 'password')).rejects.toThrow('LDAP directory unavailable')
  })

  it('creates a client per attempt and unbinds it when the initial bind fails', async () => {
    const first = client()
    first.bind.mockRejectedValueOnce(new Error('directory timeout'))
    const factory = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(client())
    const authenticator = createLdapAuthenticator(config, factory)

    await expect(authenticator.authenticate('ada', 'password')).rejects.toThrow('LDAP directory unavailable')
    await authenticator.authenticate('ada', 'password')

    expect(factory).toHaveBeenCalledTimes(2)
    expect(first.unbind).toHaveBeenCalledOnce()
  })

  it('maps only LDAP invalid-credentials responses to 401-compatible errors', async () => {
    const ldapClient = client()
    ldapClient.bind
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(Object.assign(new Error('rejected'), { code: 49 }))
    const authenticator = createLdapAuthenticator(config, () => ldapClient)

    await expect(authenticator.authenticate('ada', 'wrong')).rejects.toBeInstanceOf(InvalidCredentialsError)
    expect(ldapClient.unbind).toHaveBeenCalledOnce()
  })
})
