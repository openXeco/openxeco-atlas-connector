'use server'

import { cookies } from 'next/headers'

const sessionCookieName = process.env.FRONTEND_SESSION_COOKIE_NAME || 'atlas-session'

export const createSessionCookie = async (value: string, expiresAt: number) => {
  const cookieStore = await cookies()

  cookieStore.set(sessionCookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  })
}

export const destroySessionCookie = async () => {
  const cookieStore = await cookies()

  cookieStore.delete(sessionCookieName)
}

export const getSessionCookie = async () => {
  const cookieStore = await cookies()

  return cookieStore.get(sessionCookieName)?.value
}
