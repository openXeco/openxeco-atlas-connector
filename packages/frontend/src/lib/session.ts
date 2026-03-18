import 'server-only'

import * as crypto from 'node:crypto'

const algorithm = 'aes-256-gcm'

export const encryptSession = (data: object, secret: string) => {
  const iv = crypto.randomBytes(12)

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secret), iv)

  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()])

  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export const decryptSession = (cookie: string, secret: string) => {
  const buffer = Buffer.from(cookie, 'base64')

  const iv = buffer.subarray(0, 12)
  const tag = buffer.subarray(12, 28)
  const encrypted = buffer.subarray(28)

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secret), iv)

  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

  return JSON.parse(decrypted.toString('utf8'))
}
