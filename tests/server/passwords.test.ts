import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../server/passwords'

describe('local password hashes', () => {
  it('hashes and verifies without storing the password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash).toMatch(/^scrypt\$/)
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true)
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false)
  })
})
