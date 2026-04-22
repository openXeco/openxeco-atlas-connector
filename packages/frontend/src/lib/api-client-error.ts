import type { ApiClientError as IApiClientError } from '@/types'

export class ApiClientError extends Error implements IApiClientError {
  readonly statusCode: number
  readonly payload: Record<string, unknown> | undefined

  constructor(message?: string, statusCode?: number, payload?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiClientError'
    this.payload = payload

    this.statusCode = statusCode || 500
  }

  toString() {
    return `[API-ERROR]: ${this.message}`
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      payload: this.payload,
      stack: this.stack,
    }
  }

  valueOf() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      payload: this.payload,
    }
  }
}
