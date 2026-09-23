import { describe, expect, it } from 'vitest'
import { loadConfig } from '../../server/config'

const baseEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://localhost/geotrace',
  LDAP_URL: 'ldap://directory.example.test',
  LDAP_BASE_DN: 'dc=example,dc=test',
}

describe('server configuration', () => {
  it('rejects plain LDAP in production unless StartTLS is explicitly enabled', () => {
    expect(() => loadConfig({ ...baseEnv, NODE_ENV: 'production' })).toThrow(/Production LDAP/)
  })

  it('accepts LDAPS in production', () => {
    expect(loadConfig({ ...baseEnv, NODE_ENV: 'production', LDAP_URL: 'ldaps://directory.example.test' }).LDAP_URL).toBe('ldaps://directory.example.test')
  })

  it('accepts explicit StartTLS in production', () => {
    expect(loadConfig({ ...baseEnv, NODE_ENV: 'production', LDAP_STARTTLS: 'true' }).LDAP_STARTTLS).toBe(true)
  })
})
