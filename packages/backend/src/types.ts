export interface JwtPayload {
  userId: string
  email: string
  role: string
  type: 'access' | 'refresh'
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  refreshTokenExpiresAt: number
}

export interface ApiError {
  statusCode: number
  error: string
  message: string
}

export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
  services: {
    database: 'ok' | 'error'
  }
}

export type BasicErrorResponse = {
  status: number
  error?: string
  message?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: JwtPayload
  }
}
