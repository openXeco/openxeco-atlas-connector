import type { Logger } from '@/types.js'
import type { RequestInit, Response } from 'undici'

export interface ExternalApiError extends Error {
  readonly status: number
  readonly errors?: unknown[]
}

export type ExternalApiRequestParams = {
  method: string
  path: string
  options?: unknown
  maxRetries?: number
  prepareAuthentication?: CallableFunction
  buildUrl?: (path: string, params?: unknown) => URL
}

export type ExternalApiResponse<T, E> = {
  data?: T | null
  errors?: E[]
}

export type ExternalApiRequestOptions<R> = {
  fetchOptions?: RequestInit
  logger: Logger
  maxRetries?: number
  timeout?: number
  parseResponse?: (response: Response) => Promise<R>
}
