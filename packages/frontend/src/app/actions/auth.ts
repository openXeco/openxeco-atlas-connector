'use server'

import { cookies } from 'next/headers'

export async function createSession(refreshToken: string, refreshTokenExpiresIn: number) {
  const cookieStore = await cookies()

  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: refreshTokenExpiresIn,
  })
}

export async function destroySession() {
  const cookieStore = await cookies()

  cookieStore.delete('refreshToken')
}
