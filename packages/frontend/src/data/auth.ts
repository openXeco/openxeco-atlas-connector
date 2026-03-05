import { User } from '@/types'
import { apiClientBackend } from '@/lib/api_backend'

export const login = async (email: string, password: string) => {
  return apiClientBackend.post<{
    accessToken: string
    refreshToken: string
    refreshTokenExpiresIn: number
    user: User
  }>('/api/auth/login', { email, password })
}

export const refresh = async (refreshToken: string) => {
  return apiClientBackend.post<{ accessToken: string; refreshToken: string; refreshTokenExpiresIn: number }>(
    '/api/auth/refresh',
    {
      refreshToken,
    }
  )
}

export const getUserInfo = async (accessToken: string): Promise<User> => {
  const response = await apiClientBackend.get<{ user: User }>('/api/auth/me', { accessToken })

  return response.user
}
