'use server'

import { getSessionManager } from '@/lib/session'
import { request } from '@/lib/request'

export async function getTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  const session = getSessionManager()
  return session.get()
}

export async function refreshToken(baseUrl: string): Promise<{ accessToken: string; refreshToken: string }> {
  const session = getSessionManager()
  const { refreshToken } = await session.get()

  const data = await request<{ accessToken: string; refreshToken: string; refreshTokenExpiresAt: number }>(
    baseUrl,
    'auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    },
  )

  await session.create(data.accessToken, data.refreshToken, data.refreshTokenExpiresAt)
  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}
