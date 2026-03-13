'use server'

import { User } from '@/types'
import { apiClientBackend } from '@/lib/api-backend'
import { cache } from 'react'

export const refresh = async (refreshToken: string) => {
  return apiClientBackend.post<{
    accessToken: string
    refreshToken: string
    refreshTokenExpiresIn: number
  }>('/api/auth/refresh', { refreshToken })
}

export const getUserInfo = cache(async (): Promise<User | undefined> => {
  try {
    const response = await apiClientBackend.get<{ user: User }>('/api/auth/me', { credentials: 'include' })
    return response.user
  } catch (_e) {
    return undefined
  }
})
