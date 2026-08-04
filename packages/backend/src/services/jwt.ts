import { config } from '../config/index.js'
import ms from 'ms'
import type { TokenPair, JwtPayload } from '@/types.js'
import type fastifyJwt from '@fastify/jwt'

export function generateTokens(jwt: fastifyJwt.JWT, payload: Omit<JwtPayload, 'type'>): TokenPair {
  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    {
      expiresIn: config.JWT_EXPIRES_IN,
    },
  )

  const refreshToken = jwt.sign(
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

export async function verifyAccessToken(jwt: fastifyJwt.JWT, token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify<JwtPayload>(token)
    if (decoded.type !== 'access') {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

export async function verifyRefreshToken(jwt: fastifyJwt.JWT, token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify<JwtPayload>(token)
    if (decoded.type !== 'refresh') {
      return null
    }
    return decoded
  } catch {
    return null
  }
}
