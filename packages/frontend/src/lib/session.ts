import 'server-only'

import * as crypto from 'node:crypto'
import { z } from 'zod'
import { createSessionCookie, destroySessionCookie, getSessionCookie } from '@/lib/cookies'
import { cache } from 'react'

const algorithm = 'aes-256-gcm'

const sessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

const sessionManager = (secretKey: string) => {
  const encryptSession = (data: object, secret: string) => {
    const iv = crypto.randomBytes(12)

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secret), iv)

    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()])

    const tag = cipher.getAuthTag()

    return Buffer.concat([iv, tag, encrypted]).toString('base64')
  }

  const decryptSession = (cookie: string): { accessToken: string; refreshToken: string } => {
    try {
      const buffer = Buffer.from(cookie, 'base64')

      const iv = buffer.subarray(0, 12)
      const tag = buffer.subarray(12, 28)
      const encrypted = buffer.subarray(28)

      const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv)

      decipher.setAuthTag(tag)

      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

      return sessionSchema.parse(JSON.parse(decrypted.toString('utf8')))
    } catch {
      throw new Error('Invalid or corrupted session. Please log in again.')
    }
  }

  return {
    async create(accessToken: string, refreshToken: string, refreshTokenExpiresAt: number) {
      await createSessionCookie(encryptSession({ accessToken, refreshToken }, secretKey), refreshTokenExpiresAt)
    },

    async destroy() {
      await destroySessionCookie()
    },

    async get(): Promise<{ accessToken: string; refreshToken: string }> {
      const cookie = await getSessionCookie()

      if (!cookie) {
        throw new Error('User not authenticated. Session not found.')
      }

      return decryptSession(cookie)
    },
  }
}

export const getSessionManager = cache(() => {
  if (!process.env.FRONTEND_SECRET_KEY) {
    throw new Error('Environment variable `FRONTEND_SECRET_KEY` missing.')
  }

  return sessionManager(process.env.FRONTEND_SECRET_KEY)
})
