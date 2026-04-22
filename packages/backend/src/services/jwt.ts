import type { FastifyInstance } from 'fastify'
import { config } from '../config/index.js'
import ms from 'ms'
import type { TokenPair, JwtPayload } from '@/types.js'

export function generateTokens(fastify: FastifyInstance, payload: Omit<JwtPayload, 'type'>): TokenPair {
  const accessToken = fastify.jwt.sign(
    { ...payload, type: 'access' },
    {
      expiresIn: config.JWT_EXPIRES_IN,
    },
  )

  const refreshToken = fastify.jwt.sign(
    { ...payload, type: 'refresh' },
    {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    },
  )

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt: Date.now() + ms(config.JWT_REFRESH_EXPIRES_IN as ms.StringValue),
  }
}

export async function verifyAccessToken(fastify: FastifyInstance, token: string): Promise<JwtPayload | null> {
  try {
    const decoded = fastify.jwt.verify<JwtPayload>(token)
    if (decoded.type !== 'access') {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

export async function verifyRefreshToken(fastify: FastifyInstance, token: string): Promise<JwtPayload | null> {
  try {
    const decoded = fastify.jwt.verify<JwtPayload>(token)
    if (decoded.type !== 'refresh') {
      return null
    }
    return decoded
  } catch {
    return null
  }
}
