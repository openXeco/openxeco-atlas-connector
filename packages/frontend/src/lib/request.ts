import type { ApiClientError as IApiClientError, ApiClientOptions } from '@/types'

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

export const request = async <T>(
  baseUrl: string,
  endpoint: string,
  options: ApiClientOptions = {},
  auth?: {
    getToken: () => Promise<string>
    refreshToken: () => Promise<string>
  },
): Promise<T> => {
  const getUrl = (endpoint: string) => new URL(endpoint, baseUrl).href
  const doFetch = (accessToken?: string) =>
    fetch(url, {
      ...fetchOptions,
      headers: {
        ...(fetchOptions.method !== 'DELETE' && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...fetchOptions.headers,
      },
    })

  const { params, ...fetchOptions } = options

  let url = getUrl(endpoint)

  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  let accessToken: string | undefined

  if (options.credentials === 'include' && auth) {
    accessToken = await auth.getToken()
  }

  let response = await doFetch(accessToken)

  if (response.status === 401 && options.credentials === 'include' && auth) {
    accessToken = await auth.refreshToken()
    response = await doFetch(accessToken)
  }

  if (!response.ok) {
    const error = await response.json()
    const message = Array.isArray(error.message) ? String(error.message) : error.message || 'An error has occurred'
    throw new ApiClientError(message, response.status)
  }

  return response.json()
}
