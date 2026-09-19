import 'server-only'

import type { ApiClientOptions, User } from '@/types'
import { cache } from 'react'
import { getTokens, refreshToken } from '@/lib/auth'
import { request } from '@/lib/request'

const apiClient = (
  baseUrl: string,
  auth?: {
    getToken: () => Promise<string>
    refreshToken: () => Promise<string>
  },
) => {
  return {
    async get<T>(endpoint: string, options?: ApiClientOptions) {
      return request<T>(baseUrl, endpoint, { ...options, method: 'GET' }, auth)
    },

    async post<T>(endpoint: string, data?: unknown, options: ApiClientOptions = {}) {
      return request<T>(
        baseUrl,
        endpoint,
        {
          ...options,
          method: 'POST',
          body: data ? JSON.stringify(data) : undefined,
        },
        auth,
      )
    },

    async put<T>(endpoint: string, data?: unknown, options: ApiClientOptions = {}) {
      return request<T>(
        baseUrl,
        endpoint,
        {
          ...options,
          method: 'PUT',
          body: data ? JSON.stringify(data) : undefined,
        },
        auth,
      )
    },

    async patch<T>(endpoint: string, data?: unknown, options: ApiClientOptions = {}) {
      return request<T>(
        baseUrl,
        endpoint,
        {
          ...options,
          method: 'PATCH',
          body: data ? JSON.stringify(data) : undefined,
        },
        auth,
      )
    },

    async delete<T>(endpoint: string, options?: ApiClientOptions) {
      return request<T>(baseUrl, endpoint, { ...options, method: 'DELETE' }, auth)
    },

    getCurrentUser: cache(async () => await request<User>(baseUrl, '/auth/me', { credentials: 'include' }, auth)),

    async loginUser(email: string, password: string) {
      return this.post<{
        accessToken: string
        refreshToken: string
        refreshTokenExpiresAt: number
        user: User
      }>('/auth/login', { email, password })
    },
  }
}

export const getApiClient = cache(() => {
  if (!process.env.BACKEND_INTERNAL_URL) {
    throw new Error('Environment variable `BACKEND_INTERNAL_URL` missing.')
  }

  if (!process.env.FRONTEND_SECRET_KEY) {
    throw new Error('Environment variable `FRONTEND_SECRET_KEY` missing.')
  }

  return apiClient(process.env.BACKEND_INTERNAL_URL, {
    getToken: async () => {
      const { accessToken } = await getTokens()
      return accessToken
    },
    refreshToken: async () => {
      // biome-ignore lint/style/noNonNullAssertion: fine here
      const { accessToken } = await refreshToken(process.env.BACKEND_INTERNAL_URL!)
      return accessToken
    },
  })
})
