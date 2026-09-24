import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
const KEY_LENGTH = 64
const SALT_LENGTH = 16
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const MAX_MEM = 32 * 1024 * 1024

const scrypt = (password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number; maxmem: number }) =>
  new Promise<Buffer>((resolve, reject) => scryptCallback(password, salt, keylen, options, (error, derived) => error ? reject(error) : resolve(derived as Buffer)))

export type PasswordHash = `scrypt$${number}$${number}$${number}$${string}$${string}`

export function isValidPasswordHash(value: string): value is PasswordHash {
  const parts = value.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, n, r, p, salt, digest] = parts
  return Number(n) === SCRYPT_N
    && Number(r) === SCRYPT_R
    && Number(p) === SCRYPT_P
    && /^[0-9a-f]+$/i.test(salt) && salt.length === SALT_LENGTH * 2
    && /^[0-9a-f]+$/i.test(digest) && digest.length === KEY_LENGTH * 2
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  if (!password) throw new Error('Password must not be empty')
  const salt = randomBytes(SALT_LENGTH)
  const derived = await scrypt(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: MAX_MEM }) as Buffer
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (!isValidPasswordHash(encoded)) return false
  const [, n, r, p, saltHex, digestHex] = encoded.split('$')
  try {
    const expected = Buffer.from(digestHex, 'hex')
    const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: MAX_MEM }) as Buffer
    return derived.length === expected.length && timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}
