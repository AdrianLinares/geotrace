import { describe, expect, it } from 'vitest'
import { loadConfig } from '../../server/config'
import { hashPassword } from '../../server/passwords'

const baseEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://localhost/geotrace',
  LDAP_URL: 'ldap://directory.example.test',
  LDAP_BASE_DN: 'dc=example,dc=test',
}

describe('server configuration', () => {
  it('disables the local admin by default', () => {
    expect(loadConfig(baseEnv).LOCAL_ADMIN_ENABLED).toBe(false)
  })

  it('rejects an enabled local admin without a valid username and hash', () => {
    expect(() => loadConfig({ ...baseEnv, LOCAL_ADMIN_ENABLED: 'true' })).toThrow(/LOCAL_ADMIN_USERNAME/)
  })

  it('accepts an enabled local admin with a scrypt hash', async () => {
    const hash = await hashPassword('password')
    expect(loadConfig({ ...baseEnv, LOCAL_ADMIN_ENABLED: 'true', LOCAL_ADMIN_USERNAME: 'local-admin', LOCAL_ADMIN_PASSWORD_HASH: hash }).LOCAL_ADMIN_ENABLED).toBe(true)
  })

  it('accepts local-only administration without LDAP configuration', async () => {
    const hash = await hashPassword('password')
    const config = loadConfig({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://localhost/geotrace',
      LOCAL_ADMIN_ENABLED: 'true',
      LOCAL_ADMIN_USERNAME: 'local-admin',
      LOCAL_ADMIN_PASSWORD_HASH: hash,
    })
    expect(config.LDAP_URL).toBeUndefined()
    expect(config.LDAP_BASE_DN).toBeUndefined()
  })

  it('still requires LDAP when local administration is disabled', () => {
    expect(() => loadConfig({ NODE_ENV: 'test', DATABASE_URL: 'postgres://localhost/geotrace' })).toThrow(/LDAP_URL and LDAP_BASE_DN/)
  })

  it('rejects plain LDAP in production unless StartTLS is explicitly enabled', () => {
    expect(() => loadConfig({ ...baseEnv, NODE_ENV: 'production' })).toThrow(/Production LDAP/)
  })

  it('accepts LDAPS in production', () => {
    expect(loadConfig({ ...baseEnv, NODE_ENV: 'production', LDAP_URL: 'ldaps://directory.example.test' }).LDAP_URL).toBe('ldaps://directory.example.test')
  })

  it('accepts explicit StartTLS in production', () => {
    expect(loadConfig({ ...baseEnv, NODE_ENV: 'production', LDAP_STARTTLS: 'true' }).LDAP_STARTTLS).toBe(true)
  })

  it('rejects local admin credentials in production even with a valid hash', async () => {
    const hash = await hashPassword('password')
    expect(() => loadConfig({
      ...baseEnv,
      NODE_ENV: 'production',
      LDAP_URL: 'ldaps://directory.example.test',
      LOCAL_ADMIN_ENABLED: 'true',
      LOCAL_ADMIN_USERNAME: 'local-admin',
      LOCAL_ADMIN_PASSWORD_HASH: hash,
    })).toThrow(/not permitted.*production/i)
  })
})
