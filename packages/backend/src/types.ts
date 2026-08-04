import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { relations } from '@/db/relations.js'
import type pino from 'pino'
import type { ZodError } from 'zod'
import type { SYNC_CODES, SYNC_STATUSES, ENTITY_STATUSES, replies } from '@/config/constants.js'
import type { FastifyBaseLogger } from 'fastify'

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

export type DB = PostgresJsDatabase<typeof relations>

export type Logger = pino.Logger

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: JwtPayload
  }
}

export type BasicErrorResponse = {
  status: number
  error: string
  message?: string
}

export type Replies = typeof replies
export type ReplyType = keyof Replies

export type ActionArgs<T = undefined, D = undefined> = {
  db: DB
  id?: string
  logger: pino.Logger | FastifyBaseLogger
} & ([T] extends [undefined] ? { data?: never } : { data: T }) &
  ([D] extends [undefined] ? { dependencies?: never } : { dependencies: D })

export type ActionSuccess<T> = {
  message?: string
} & ([T] extends [undefined] ? { data?: never } : { data: T })

export type ActionError =
  | {
      code: 'validation'
      message?: string
      error?: ZodError
      additionalPayload?: Record<string, unknown>
    }
  | {
      code: 'unexpected' | 'external'
      message?: string
      error?: Error
    }
  | {
      code: 'notFound' | 'conflict' | 'unauthorized' | 'forbidden'
      message?: string
    }

export type ActionResult<T = undefined> =
  | ({
      success: true
    } & ActionSuccess<T>)
  | ({
      success: false
    } & ActionError)

export type GetErrorReplyArgs = {
  type?: ReplyType
  message?: string
  additionalPayload?: Record<string, unknown>
}

export type ErrorReply = {
  status: number
  payload: {
    error: string
    message?: string
    payload?: Record<string, unknown>
  }
}

export type PaginatedResult<T> = {
  data: T[]
  meta: {
    count: number // the number of current entries
    total: number // the total number in the database
    page: number
    limit: number
  }
}

/** Business Domain **/
export type EntityStatus = (typeof ENTITY_STATUSES)[number]

export type SyncStatus = (typeof SYNC_STATUSES)[number]
export type SyncCode = (typeof SYNC_CODES)[number]
