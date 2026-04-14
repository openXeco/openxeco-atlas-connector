import 'server-only'

import type { ApiClientOptions, ApiClientError as IApiClientError, User } from '@/types'
import path from 'node:path'
import { cookies } from 'next/headers'
import { encryptSession, decryptSession } from '@/lib/session'
import { cache } from 'react'

class ApiClientError extends Error implements IApiClientError {
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

const apiClient = (baseUrl: string, secretKey: string, sessionCookieName = 'atlas-session') => {
  const getUrl = (endpoint: string) => path.join(baseUrl, endpoint)

  const request = async <T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> => {
    const { params, ...fetchOptions } = options

    const accessToken: string | undefined = options.forceAccessToken
      ? options.forceAccessToken
      : options.credentials === 'include'
        ? await getAccessToken()
        : undefined

    let url = getUrl(endpoint)

    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...(fetchOptions.method !== 'DELETE' && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...fetchOptions.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      const message = Array.isArray(error.message) ? String(error.message) : error.message || 'An error has occurred'
      throw new ApiClientError(message, response.status)
    }

    return response.json()
  }

  const createSession = async (accessToken: string, refreshToken: string, refreshTokenExpiresAt: number) => {
    const cookieStore = await cookies()

    cookieStore.set(
      sessionCookieName,
      encryptSession(
        {
          accessToken,
          refreshToken,
        },
        secretKey,
      ),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: refreshTokenExpiresAt,
      },
    )
  }

  const destroySession = async () => {
    const cookieStore = await cookies()

    cookieStore.delete(sessionCookieName)
  }

  const getAccessToken = async () => {
    const cookieStore = await cookies()

    const session = cookieStore.get(sessionCookieName)?.value

    if (!session) {
      throw new Error('User not authenticated. Session not found.')
    }

    const { accessToken, refreshToken } = decryptSession(session, secretKey)

    try {
      await request('auth/me', { forceAccessToken: accessToken })
      // Everything good here. Return AccessToken
      return accessToken
    } catch (e) {
      if ((e as ApiClientError).statusCode === 401) {
        // Access token expired. Refreshing...
        const data = await request<{ accessToken: string; refreshToken: string; refreshTokenExpiresAt: number }>(
          'auth/refresh',
          {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          },
        )

        await createSession(data.accessToken, data.refreshToken, data.refreshTokenExpiresAt)
        return data.accessToken
      }

      // await destroySession()
      throw e
    }
  }

  return {
    verifySession: cache(async () => {
      console.debug('Verifying Session')
      await getAccessToken()
    }),

    async get<T>(endpoint: string, options?: ApiClientOptions) {
      return request<T>(endpoint, { ...options, method: 'GET' })
    },

    async post<T>(endpoint: string, data?: unknown, options: ApiClientOptions = {}) {
      return request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      })
    },

    async patch<T>(endpoint: string, data?: unknown, options: ApiClientOptions = {}) {
      return request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      })
    },

    async delete<T>(endpoint: string, options?: ApiClientOptions) {
      return request<T>(endpoint, { ...options, method: 'DELETE' })
    },

    getCurrentUser: cache(async () => {
      const response = await request<{ user: User }>('/auth/me', { credentials: 'include' })
      return response.user
    }),

    async loginUser(email: string, password: string) {
      const response = await this.post<{
        accessToken: string
        refreshToken: string
        refreshTokenExpiresAt: number
        user: User
      }>('/auth/login', { email, password })
      await createSession(response.accessToken, response.refreshToken, response.refreshTokenExpiresAt)

      return response.user
    },

    async logoutUser() {
      await destroySession()
    },
  }
}

export const getApiClient = async () => {
  if (!process.env.BACKEND_INTERNAL_URL) {
    throw new Error('Environment variable `BACKEND_INTERNAL_URL` missing.')
  }

  if (!process.env.FRONTEND_SECRET_KEY) {
    throw new Error('Environment variable `FRONTEND_SECRET_KEY` missing.')
  }

  return apiClient(
    process.env.BACKEND_INTERNAL_URL,
    process.env.FRONTEND_SECRET_KEY,
    process.env.FRONTEND_SESSION_COOKIE_NAME,
  )
}
