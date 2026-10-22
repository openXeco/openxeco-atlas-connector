import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('password hashing on the deployed Node runtime', () => {
  it('accepts the original password and rejects a different password', async () => {
    const encoded = await hashPassword('runtime-review-password')
    expect(encoded).toMatch(/^\$argon2id\$/)
    expect(await verifyPassword(encoded, 'runtime-review-password')).toBe(true)
    expect(await verifyPassword(encoded, 'different-password')).toBe(false)
  })

  it('uses a distinct salt for repeated hashes of the same password', async () => {
    const first = await hashPassword('runtime-review-password')
    const second = await hashPassword('runtime-review-password')
    expect(first).not.toBe(second)
    expect(await verifyPassword(first, 'runtime-review-password')).toBe(true)
    expect(await verifyPassword(second, 'runtime-review-password')).toBe(true)
  })

  it('rejects malformed persisted password hashes without throwing', async () => {
    expect(await verifyPassword('not-an-argon2-hash', 'runtime-review-password')).toBe(false)
  })
})
