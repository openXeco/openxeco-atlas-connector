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

export const ENTITY_STATUSES = ['draft', 'ready_for_publication', 'published', 'to_be_rejected', 'rejected'] as const
export const SYNC_STATUSES = ['pending_push', 'synced', 'failed'] as const
export const SYNC_CODES = ['conflict', 'not_found'] as const

export type EntityStatus = (typeof ENTITY_STATUSES)[number]
export type SyncStatus = (typeof SYNC_STATUSES)[number]
export type SyncCode = (typeof SYNC_CODES)[number]
